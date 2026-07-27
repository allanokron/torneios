import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { hash } from "bcryptjs"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const secret = body.secret
    if (secret !== "seed-torneio-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const results: Record<string, unknown> = {}

    // 1. Create legal documents
    const existingDocs = await prisma.legalDocument.count()
    if (existingDocs === 0) {
      const docs = await Promise.all([
        prisma.legalDocument.create({ data: { slug: "terms-of-use", title: "Termos de Uso", content: "Termos de Uso do Torneio+", version: "1.0", isActive: true } }),
        prisma.legalDocument.create({ data: { slug: "privacy-policy", title: "Política de Privacidade", content: "Política de Privacidade do Torneio+", version: "1.0", isActive: true } }),
        prisma.legalDocument.create({ data: { slug: "cookies", title: "Política de Cookies", content: "Política de Cookies do Torneio+", version: "1.0", isActive: true } })
      ])
      results.legalDocuments = docs.map(d => d.slug)
    } else {
      results.legalDocuments = "already exist"
    }

    // 2. Create test users
    const existingUsers = await prisma.user.count()
    if (existingUsers <= 1) {
      const passwordHash = await hash("123456", 12)
      const users = await Promise.all([
        prisma.user.upsert({
          where: { email: "allan@email.com" },
          update: {},
          create: { email: "allan@email.com", name: "Allan Silva", passwordHash, city: "São Paulo", state: "SP", profile: { create: {} } }
        }),
        prisma.user.upsert({
          where: { email: "maria@email.com" },
          update: {},
          create: { email: "maria@email.com", name: "Maria Santos", passwordHash, city: "São Paulo", state: "SP", profile: { create: {} } }
        }),
        prisma.user.upsert({
          where: { email: "joao@email.com" },
          update: {},
          create: { email: "joao@email.com", name: "João Oliveira", passwordHash, city: "Rio de Janeiro", state: "RJ", profile: { create: {} } }
        }),
        prisma.user.upsert({
          where: { email: "ana@email.com" },
          update: {},
          create: { email: "ana@email.com", name: "Ana Costa", passwordHash, city: "Belo Horizonte", state: "MG", profile: { create: {} } }
        }),
        prisma.user.upsert({
          where: { email: "pedro@email.com" },
          update: {},
          create: { email: "pedro@email.com", name: "Pedro Lima", passwordHash, city: "Curitiba", state: "PR", profile: { create: {} } }
        }),
        prisma.user.upsert({
          where: { email: "cid@email.com" },
          update: {},
          create: { email: "cid@email.com", name: "CID", passwordHash, profile: { create: {} } }
        })
      ])
      results.users = users.map(u => u.email)

      // Accept consents for all users
      for (const user of users) {
        for (const slug of ["terms-of-use", "privacy-policy"]) {
          const doc = await prisma.legalDocument.findFirst({ where: { slug, isActive: true } })
          if (doc) {
            await prisma.consent.upsert({
              where: {
                userId_documentSlug_documentVersion: {
                  userId: user.id,
                  documentSlug: slug,
                  documentVersion: doc.version,
                }
              },
              update: { accepted: true },
              create: {
                userId: user.id,
                documentId: doc.id,
                documentSlug: slug,
                documentTitle: doc.title,
                documentVersion: doc.version,
                accepted: true,
              }
            })
          }
        }
      }
      results.consents = "accepted for all users"
    } else {
      results.users = `${existingUsers} users already exist`

      // Accept consents for ALL existing users who don't have them
      const allUsers = await prisma.user.findMany()
      for (const user of allUsers) {
        for (const slug of ["terms-of-use", "privacy-policy"]) {
          const doc = await prisma.legalDocument.findFirst({ where: { slug, isActive: true } })
          if (doc) {
            await prisma.consent.upsert({
              where: {
                userId_documentSlug_documentVersion: {
                  userId: user.id,
                  documentSlug: slug,
                  documentVersion: doc.version,
                }
              },
              update: { accepted: true },
              create: {
                userId: user.id,
                documentId: doc.id,
                documentSlug: slug,
                documentTitle: doc.title,
                documentVersion: doc.version,
                accepted: true,
              }
            })
          }
        }
      }
      results.consents = "auto-accepted for all existing users"
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Erro no seed:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
