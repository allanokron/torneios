import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const messages = await prisma.message.findMany({
      where: { matchId: id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
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

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: "Partida não encontrada" },
        { status: 404 }
      )
    }

    const isPlayer = match.homePlayerId === decoded.userId || match.awayPlayerId === decoded.userId
    const isOrganizer = match.tournament.ownerId === decoded.userId

    if (!isPlayer && !isOrganizer) {
      return NextResponse.json(
        { error: "Você não tem permissão para enviar mensagens nesta partida" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, imageUrl } = body

    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: "Mensagem ou imagem é obrigatória" },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        matchId: id,
        senderId: decoded.userId,
        content: content || "",
        imageUrl: imageUrl || null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    })

    // Create notification for the other player
    const otherPlayerId = match.homePlayerId === decoded.userId 
      ? match.awayPlayerId 
      : match.homePlayerId

    await prisma.notification.create({
      data: {
        userId: otherPlayerId,
        title: "Nova mensagem",
        message: `Você recebeu uma nova mensagem em uma partida`,
        type: "match",
        link: `/tournaments/${match.tournamentId}/matches/${id}`
      }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}