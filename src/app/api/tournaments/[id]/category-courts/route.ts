import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { canManageTournament } from "@/lib/platform-admin"
import { validateTournamentSport, SportAccessError } from "@/lib/sports/middleware"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    // Validate sport - this endpoint is beach_volley-only
    try {
      await validateTournamentSport(id, "beach_volley")
    } catch (error) {
      if (error instanceof SportAccessError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    const assignments = await prisma.categoryCourt.findMany({
      where: { category: { tournamentId: id } },
      include: {
        category: { select: { id: true, name: true } },
        court: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("Erro ao buscar vínculos quadra-categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    // Validate sport - this endpoint is beach_volley-only
    try {
      await validateTournamentSport(id, "beach_volley")
    } catch (error) {
      if (error instanceof SportAccessError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    if (!(await canManageTournament(decoded.userId, tournament.ownerId))) {
      return NextResponse.json({ error: "Você não tem permissão" }, { status: 403 })
    }

    const body = await request.json()
    const { assignments } = body as {
      assignments: Array<{ categoryId: string; courtIds: string[] }>
    }

    if (!Array.isArray(assignments)) {
      return NextResponse.json({ error: "assignments deve ser um array" }, { status: 400 })
    }

    const result = await prisma.$transaction(async tx => {
      const created: Array<{ id: string; categoryId: string; courtId: string }> = []

      for (const assignment of assignments) {
        for (const courtId of assignment.courtIds) {
          const existing = await tx.categoryCourt.findUnique({
            where: { categoryId_courtId: { categoryId: assignment.categoryId, courtId } },
          })

          if (!existing) {
            const record = await tx.categoryCourt.create({
              data: {
                categoryId: assignment.categoryId,
                courtId,
              },
            })
            created.push(record)
          }
        }
      }

      return created
    })

    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "category_courts_assigned",
        entityType: "CategoryCourt",
        newValue: { count: result.length, assignments },
      },
    })

    return NextResponse.json({ created: result }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar vínculos quadra-categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    // Validate sport - this endpoint is beach_volley-only
    try {
      await validateTournamentSport(id, "beach_volley")
    } catch (error) {
      if (error instanceof SportAccessError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    if (!(await canManageTournament(decoded.userId, tournament.ownerId))) {
      return NextResponse.json({ error: "Você não tem permissão" }, { status: 403 })
    }

    const body = await request.json()
    const { ids } = body as { ids: string[] }

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: "ids deve ser um array não vazio" }, { status: 400 })
    }

    await prisma.categoryCourt.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    console.error("Erro ao deletar vínculos quadra-categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
