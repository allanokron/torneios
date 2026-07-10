import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const courts = await prisma.court.findMany({
      where: { tournamentId: id },
      include: {
        availabilities: true,
        blockedSlots: true,
        _count: {
          select: {
            reservations: {
              where: { isCancelled: false }
            }
          }
        }
      },
      orderBy: {
        number: "asc"
      }
    })

    return NextResponse.json({ courts })
  } catch (error) {
    console.error("Erro ao buscar quadras:", error)
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

    const tournament = await prisma.tournament.findUnique({
      where: { id }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneio não encontrado" },
        { status: 404 }
      )
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o organizador pode criar quadras" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, number, surfaceType, isCovered, availabilities } = body

    if (!name) {
      return NextResponse.json(
        { error: "Nome da quadra é obrigatório" },
        { status: 400 }
      )
    }

    const court = await prisma.court.create({
      data: {
        name,
        number: number || null,
        surfaceType: surfaceType || null,
        isCovered: isCovered || false,
        tournamentId: id,
        ownerId: decoded.userId,
        availabilities: availabilities ? {
          create: availabilities.map((avail: { dayOfWeek: number; startTime: string; endTime: string }) => ({
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime
          }))
        } : undefined
      },
      include: {
        availabilities: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "court_created",
        entityType: "court",
        entityId: court.id,
        newValue: { name: court.name }
      }
    })

    return NextResponse.json({ court }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar quadra:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}