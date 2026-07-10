import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const members = await prisma.tournamentMember.findMany({
      where: { tournamentId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            city: true,
            state: true,
            gameLevel: true
          }
        }
      },
      orderBy: {
        joinedAt: "asc"
      }
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Erro ao buscar membros:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { email, userId, role } = body

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: decoded.userId, role: "organizer" }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneio não encontrado" },
        { status: 404 }
      )
    }

    const isOrganizer = tournament.ownerId === decoded.userId || 
      tournament.members.some(m => m.role === "organizer")

    if (!isOrganizer) {
      return NextResponse.json(
        { error: "Apenas o organizador pode adicionar participantes" },
        { status: 403 }
      )
    }

    if (tournament.status !== "draft" && tournament.status !== "registration_open") {
      return NextResponse.json(
        { error: "Não é possível adicionar participantes com este status" },
        { status: 400 }
      )
    }

    if (tournament.maxParticipants) {
      const currentCount = await prisma.tournamentMember.count({
        where: { tournamentId: id, status: "accepted" }
      })
      
      if (currentCount >= tournament.maxParticipants) {
        return NextResponse.json(
          { error: "Torneio atingiu o limite de participantes" },
          { status: 400 }
        )
      }
    }

    let targetUserId = userId

    if (email && !userId) {
      const user = await prisma.user.findUnique({
        where: { email }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: "Usuário não encontrado com este e-mail" },
          { status: 404 }
        )
      }
      targetUserId = user.id
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "É necessário fornecer email ou userId" },
        { status: 400 }
      )
    }

    const existingMember = await prisma.tournamentMember.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: targetUserId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "Usuário já é participante deste torneio" },
        { status: 400 }
      )
    }

    const member = await prisma.tournamentMember.create({
      data: {
        tournamentId: id,
        userId: targetUserId,
        role: role || "player",
        status: "pending"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: "Convite para torneio",
        message: `Você foi convidado para o torneio ${tournament.name}`,
        type: "invite",
        link: `/tournaments/${id}`
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "member_invited",
        entityType: "member",
        entityId: member.id,
        newValue: { userId: targetUserId, role: role || "player" }
      }
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar membro:", error)
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
    const { memberId, status } = body

    const member = await prisma.tournamentMember.findUnique({
      where: { id: memberId },
      include: {
        tournament: true
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      )
    }

    if (member.userId !== decoded.userId && member.tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para esta ação" },
        { status: 403 }
      )
    }

    const updatedMember = await prisma.tournamentMember.update({
      where: { id: memberId },
      data: {
        status,
        joinedAt: status === "accepted" ? new Date() : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: `member_${status}`,
        entityType: "member",
        entityId: memberId,
        newValue: { status }
      }
    })

    return NextResponse.json({ member: updatedMember })
  } catch (error) {
    console.error("Erro ao atualizar membro:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}