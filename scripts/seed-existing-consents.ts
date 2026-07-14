import "dotenv/config";
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const users = await prisma.user.findMany()
  const docs = await prisma.legalDocument.findMany({ where: { isActive: true } })

  for (const user of users) {
    for (const doc of docs) {
      const existing = await prisma.consent.findFirst({
        where: { userId: user.id, documentId: doc.id }
      })
      if (!existing) {
        await prisma.consent.create({
          data: {
            userId: user.id,
            documentId: doc.id,
            documentSlug: doc.slug,
            documentTitle: doc.title,
            documentVersion: doc.version,
            accepted: true,
          }
        })
      }
    }
    console.log(`✓ ${user.name} — consentimentos registrados`)
  }
}

main().then(() => prisma.$disconnect())
