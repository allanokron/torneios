import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { getTeamSizeValue } from "@/lib/category-config"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const teams = await prisma.categoryTeam.findMany({
      where: { categoryId },
      orderBy: [{ createdAt: "asc" }],
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        invites: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Erro ao buscar equipes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const category = await prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: {
        tournament: { select: { id: true, ownerId: true } },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    const body = await request.json()
    const isOrganizer = category.tournament.ownerId === decoded.userId
    const requestedMembers = Array.isArray(body.members) ? body.members : []
    const maxSize = getTeamSizeValue(category.teamSize)
    const shouldIncludeCreator = body.includeCreator !== false || !isOrganizer
    const totalMembers = requestedMembers.length + (shouldIncludeCreator ? 1 : 0)

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Informe o nome da equipe" }, { status: 400 })
    }

    if (totalMembers > maxSize) {
      return NextResponse.json(
        { error: `Esta categoria permite no máximo ${maxSize} atleta(s) por equipe` },
        { status: 400 }
      )
    }

    if (!isOrganizer && category.status !== "registration_open" && category.status !== "draft") {
      return NextResponse.json(
        { error: "As inscrições desta categoria não estão abertas" },
        { status: 400 }
      )
    }

    const team = await prisma.$transaction(async (tx) => {
      const createdTeam = await tx.categoryTeam.create({
        data: {
          categoryId,
          name: body.name.trim(),
          createdBy: decoded.userId,
          status: totalMembers >= maxSize ? "complete" : "pending",
        },
      })

      if (shouldIncludeCreator) {
        await tx.categoryTeamMember.create({
          data: {
            teamId: createdTeam.id,
            userId: decoded.userId,
            role: isOrganizer && body.includeCreator === false ? "organizer_added" : "player",
            status: "accepted",
            paymentStatus: category.paymentMode === "online" ? "NONE" : "MANUAL_CONFIRMED",
          },
        })
      }

      for (const member of requestedMembers) {
        const email = typeof member?.email === "string" ? member.email.trim().toLowerCase() : ""
        const name = typeof member?.name === "string" ? member.name.trim() : null
        if (!email && !name) continue

        const user = email
          ? await tx.user.findUnique({ where: { email }, select: { id: true } })
          : null

        await tx.categoryTeamMember.create({
          data: {
            teamId: createdTeam.id,
            userId: user?.id ?? null,
            name,
            email: email || null,
            role: isOrganizer ? "organizer_added" : "player",
            status: isOrganizer ? "accepted" : "pending",
            paymentStatus: category.paymentMode === "online" ? "NONE" : isOrganizer ? "MANUAL_CONFIRMED" : null,
          },
        })

        if (!isOrganizer && email) {
          await tx.categoryTeamInvite.create({
            data: {
              teamId: createdTeam.id,
              senderId: decoded.userId,
              email,
              name,
              message: typeof body.message === "string" ? body.message : null,
            },
          })
        }
      }

      return tx.categoryTeam.findUnique({
        where: { id: createdTeam.id },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          },
          invites: true,
        },
      })
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar equipe:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
