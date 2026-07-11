import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { isCourtAvailable, isPlayerAvailable } from "@/lib/timezone"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: true
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: "Partida não encontrada" },
        { status: 404 }
      )
    }

    if (match.homePlayerId !== decoded.userId && match.awayPlayerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas os jogadores desta partida podem propor agendamento" },
        { status: 403 }
      )
    }

    if (match.status !== "pending_scheduling" && match.status !== "awaiting_response") {
      return NextResponse.json(
        { error: "Esta partida não pode ser agendada" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { proposedDate, proposedTime, courtId, message } = body

    if (!proposedDate || !proposedTime || !courtId) {
      return NextResponse.json(
        { error: "Data, horário e quadra são obrigatórios" },
        { status: 400 }
      )
    }

    // Check if court exists and belongs to tournament
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        tournamentId: match.tournamentId
      }
    })

    if (!court) {
      return NextResponse.json(
        { error: "Quadra não encontrada" },
        { status: 404 }
      )
    }

    // Parse proposed date and time in Brasilia timezone (UTC-3)
    const [hours, minutes] = proposedTime.split(":").map(Number)
    // Create date string in Brasilia time by subtracting 3 hours from UTC
    const startTime = new Date(`${proposedDate}T${proposedTime}:00.000-03:00`)
    
    const endTime = new Date(startTime.getTime() + match.duration * 60 * 1000)

    // Check court availability
    const courtReservations = await prisma.reservation.findMany({
      where: {
        courtId,
        isCancelled: false
      }
    })

    if (!isCourtAvailable(courtId, startTime, endTime, courtReservations)) {
      return NextResponse.json(
        { error: "Quadra não disponível neste horário" },
        { status: 400 }
      )
    }

    // Check player availability
    const playerMatchesRaw = await prisma.match.findMany({
      where: {
        OR: [
          { homePlayerId: match.homePlayerId },
          { awayPlayerId: match.awayPlayerId },
          { homePlayerId: match.awayPlayerId },
          { awayPlayerId: match.homePlayerId }
        ],
        status: {
          notIn: ["cancelled", "finished", "wo"]
        },
        scheduledAt: {
          not: null
        }
      }
    })
    const playerMatches = playerMatchesRaw.filter((m): m is typeof m & { scheduledAt: Date } => m.scheduledAt !== null)

    if (!isPlayerAvailable(match.homePlayerId, startTime, endTime, playerMatches)) {
      return NextResponse.json(
        { error: "Um dos jogadores não está disponível neste horário" },
        { status: 400 }
      )
    }

    if (!isPlayerAvailable(match.awayPlayerId, startTime, endTime, playerMatches)) {
      return NextResponse.json(
        { error: "Um dos jogadores não está disponível neste horário" },
        { status: 400 }
      )
    }

    // Create proposal
    const proposal = await prisma.scheduleProposal.create({
      data: {
        matchId: id,
        senderId: decoded.userId,
        receiverId: match.homePlayerId === decoded.userId 
          ? match.awayPlayerId 
          : match.homePlayerId,
        proposedDate: startTime,
        proposedTime,
        courtId,
        message: message || null,
        status: "pending"
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        court: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Update match status
    await prisma.match.update({
      where: { id },
      data: { status: "proposal_sent" }
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: proposal.receiverId,
        title: "Proposta de agendamento",
        message: `Você recebeu uma proposta de agendamento para uma partida`,
        type: "scheduling",
        link: `/tournaments/${match.tournamentId}/matches/${id}`
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        userId: decoded.userId,
        action: "schedule_proposal_created",
        entityType: "proposal",
        entityId: proposal.id,
        newValue: {
          proposedDate: startTime,
          proposedTime,
          courtId
        }
      }
    })

    return NextResponse.json({ proposal }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar proposta:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { proposalId, action, responseMessage } = body

    const proposal = await prisma.scheduleProposal.findUnique({
      where: { id: proposalId },
      include: {
        match: true
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposta não encontrada" },
        { status: 404 }
      )
    }

    if (proposal.receiverId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o destinatário pode responder esta proposta" },
        { status: 403 }
      )
    }

    if (proposal.status !== "pending") {
      return NextResponse.json(
        { error: "Esta proposta já foi respondida" },
        { status: 400 }
      )
    }

    if (action === "accept") {
      // Accept proposal
      await prisma.scheduleProposal.update({
        where: { id: proposalId },
        data: {
          status: "accepted",
          responseMessage
        }
      })

      // Create reservation
      const startTime = new Date(proposal.proposedDate)
      const endTime = new Date(startTime.getTime() + proposal.match.duration * 60 * 1000)

      await prisma.reservation.create({
        data: {
          matchId: proposal.matchId,
          courtId: proposal.courtId,
          startTime,
          endTime,
          isConfirmed: true
        }
      })

      // Update match
      await prisma.match.update({
        where: { id: proposal.matchId },
        data: {
          status: "scheduled",
          scheduledAt: startTime,
          courtId: proposal.courtId
        }
      })

      // Create notification for sender
      await prisma.notification.create({
        data: {
          userId: proposal.senderId,
          title: "Proposta aceita",
          message: `Sua proposta de agendamento foi aceita`,
          type: "scheduling",
          link: `/tournaments/${proposal.match.tournamentId}/matches/${proposal.matchId}`
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tournamentId: proposal.match.tournamentId,
          userId: decoded.userId,
          action: "schedule_proposal_accepted",
          entityType: "proposal",
          entityId: proposalId,
          newValue: { scheduledAt: startTime }
        }
      })

      return NextResponse.json({ success: true })
    } else if (action === "reject") {
      if (!responseMessage) {
        return NextResponse.json(
          { error: "É necessário informar o motivo da recusa" },
          { status: 400 }
        )
      }

      await prisma.scheduleProposal.update({
        where: { id: proposalId },
        data: {
          status: "rejected",
          responseMessage
        }
      })

      // Update match status
      await prisma.match.update({
        where: { id: proposal.matchId },
        data: { status: "pending_scheduling" }
      })

      // Create notification for sender
      await prisma.notification.create({
        data: {
          userId: proposal.senderId,
          title: "Proposta recusada",
          message: `Sua proposta de agendamento foi recusada: ${responseMessage}`,
          type: "scheduling",
          link: `/tournaments/${proposal.match.tournamentId}/matches/${proposal.matchId}`
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tournamentId: proposal.match.tournamentId,
          userId: decoded.userId,
          action: "schedule_proposal_rejected",
          entityType: "proposal",
          entityId: proposalId,
          newValue: { responseMessage }
        }
      })

      return NextResponse.json({ success: true })
    } else if (action === "counter_proposal") {
      const { proposedDate, proposedTime, courtId } = body

      if (!proposedDate || !proposedTime || !courtId) {
        return NextResponse.json(
          { error: "Data, horário e quadra são obrigatórios para contraproposta" },
          { status: 400 }
        )
      }

      // Validate court belongs to tournament
      const court = await prisma.court.findFirst({
        where: { id: courtId, tournamentId: proposal.match.tournamentId }
      })
      if (!court) {
        return NextResponse.json(
          { error: "Quadra não encontrada" },
          { status: 404 }
        )
      }

      // Parse proposed date and time in Brasilia timezone (UTC-3)
      const startTime = new Date(`${proposedDate}T${proposedTime}:00.000-03:00`)
      const endTime = new Date(startTime.getTime() + proposal.match.duration * 60 * 1000)

      // Check court availability
      const courtReservations = await prisma.reservation.findMany({
        where: { courtId, isCancelled: false }
      })
      if (!isCourtAvailable(courtId, startTime, endTime, courtReservations)) {
        return NextResponse.json(
          { error: "Quadra não disponível neste horário" },
          { status: 400 }
        )
      }

      // Check player availability
      const playerMatchesRaw = await prisma.match.findMany({
        where: {
          OR: [
            { homePlayerId: proposal.match.homePlayerId },
            { awayPlayerId: proposal.match.homePlayerId },
            { homePlayerId: proposal.match.awayPlayerId },
            { awayPlayerId: proposal.match.awayPlayerId }
          ],
          status: { notIn: ["cancelled", "finished", "wo"] },
          scheduledAt: { not: null }
        }
      })
      const playerMatches = playerMatchesRaw.filter(
        (m): m is typeof m & { scheduledAt: Date } => m.scheduledAt !== null
      )

      if (!isPlayerAvailable(proposal.match.homePlayerId, startTime, endTime, playerMatches)) {
        return NextResponse.json(
          { error: "Um dos jogadores não está disponível neste horário" },
          { status: 400 }
        )
      }
      if (!isPlayerAvailable(proposal.match.awayPlayerId, startTime, endTime, playerMatches)) {
        return NextResponse.json(
          { error: "Um dos jogadores não está disponível neste horário" },
          { status: 400 }
        )
      }

      // Update original proposal status
      await prisma.scheduleProposal.update({
        where: { id: proposalId },
        data: { status: "rejected", responseMessage: responseMessage || "Contraproposta enviada" }
      })

      // Create counter-proposal (new proposal from receiver to sender)
      const counterProposal = await prisma.scheduleProposal.create({
        data: {
          matchId: proposal.matchId,
          senderId: decoded.userId,
          receiverId: proposal.senderId,
          proposedDate: startTime,
          proposedTime,
          courtId,
          message: responseMessage || null,
          status: "pending"
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
          court: { select: { id: true, name: true } }
        }
      })

      // Update match status
      await prisma.match.update({
        where: { id: proposal.matchId },
        data: { status: "proposal_sent" }
      })

      // Notify original sender
      await prisma.notification.create({
        data: {
          userId: proposal.senderId,
          title: "Contraproposta recebida",
          message: `Você recebeu uma contraproposta de agendamento`,
          type: "scheduling",
          link: `/tournaments/${proposal.match.tournamentId}/matches/${proposal.matchId}`
        }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          tournamentId: proposal.match.tournamentId,
          userId: decoded.userId,
          action: "schedule_counter_proposal",
          entityType: "proposal",
          entityId: counterProposal.id,
          newValue: { proposedDate: startTime, proposedTime, courtId }
        }
      })

      return NextResponse.json({ proposal: counterProposal }, { status: 201 })
    }

    return NextResponse.json(
      { error: "Ação inválida" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Erro ao processar proposta:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}