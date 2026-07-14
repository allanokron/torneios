import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, phone, city, state, birthDate, bio, gameLevel, dominantHand, acceptedTerms, acceptedPrivacy, marketingConsent } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      return NextResponse.json(
        { error: "Você deve aceitar os Termos de Uso e a Política de Privacidade" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        city: city || null,
        state: state || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        bio: bio || null,
        gameLevel: gameLevel || null,
        dominantHand: dominantHand || null,
        profile: {
          create: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    const token = generateToken(user.id)

    // Record consent records
    try {
      const userAgent = request.headers.get("user-agent") || null
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null

      const consents = [
        { documentSlug: "terms-of-use", accepted: true, documentTitle: "Termos de Uso" },
        { documentSlug: "privacy-policy", accepted: true, documentTitle: "Política de Privacidade" },
        { documentSlug: "cookies", accepted: !!marketingConsent, documentTitle: "Política de Cookies" },
      ]

      for (const c of consents) {
        const doc = await prisma.legalDocument.findFirst({
          where: { slug: c.documentSlug, isActive: true },
        })
        if (doc) {
          await prisma.consent.create({
            data: {
              userId: user.id,
              documentId: doc.id,
              documentSlug: c.documentSlug,
              documentTitle: doc.title,
              documentVersion: doc.version,
              accepted: c.accepted,
              ipAddress: ip,
              userAgent,
            },
          })
        }
      }
    } catch (consentError) {
      console.error("Erro ao registrar consentimentos:", consentError)
    }

    return NextResponse.json({
      user,
      token
    }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}