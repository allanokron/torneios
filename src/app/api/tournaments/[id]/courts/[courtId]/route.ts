import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// PATCH — Update a court
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const { id, courtId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este torneio" },
        { status: 403 }
      )
    }

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: { _count: { select: { reservations: true } } }
    })

    if (!court || court.tournamentId !== id) {
      return NextResponse.json({ error: "Quadra não encontrada" }, { status: 404 })
    }

    const body = await request.json()

    const updatedCourt = await prisma.court.update({
      where: { id: courtId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.number !== undefined && { number: body.number }),
        ...(body.surfaceType !== undefined && { surfaceType: body.surfaceType }),
        ...(body.isCovered !== undefined && { isCovered: body.isCovered })
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "court_updated",
        entityType: "court",
        entityId: courtId,
        oldValue: { name: court.name },
        newValue: { name: updatedCourt.name }
      }
    })

    return NextResponse.json({ court: updatedCourt })
  } catch (error) {
    console.error("Erro ao atualizar quadra:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE — Remove a court
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const { id, courtId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este torneio" },
        { status: 403 }
      )
    }

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: { _count: { select: { reservations: true, matches: true } } }
    })

    if (!court || court.tournamentId !== id) {
      return NextResponse.json({ error: "Quadra não encontrada" }, { status: 404 })
    }

    if (court._count.matches > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir quadra com partidas associadas" },
        { status: 400 }
      )
    }

    await prisma.court.delete({ where: { id: courtId } })

    // Audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "court_deleted",
        entityType: "court",
        entityId: courtId,
        oldValue: { name: court.name }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir quadra:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
