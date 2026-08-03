import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getOrganizerAccess } from "@/lib/organizer-access"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const access = await getOrganizerAccess(decoded.userId)
    return NextResponse.json({
      canCreateTournament: access.canCreateTournament,
      reason: access.reason,
      ownedTournaments: access.ownedTournaments,
      subscription: access.subscription
        ? {
            status: access.subscription.status,
            monthlyValue: Number(access.subscription.monthlyValue),
            plan: access.subscription.plan,
          }
        : null,
      availableCredit: access.availableCredit
        ? {
            id: access.availableCredit.id,
            value: access.availableCredit.value,
            status: access.availableCredit.status,
          }
        : null,
    })
  } catch (error) {
    console.error("Erro ao buscar acesso de organizador:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
