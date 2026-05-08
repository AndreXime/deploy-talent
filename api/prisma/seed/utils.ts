import type { PrismaClient } from '../../generated/prisma/client'

export const EMAIL_DOMAIN = 'seed.local'
export const SEED_PASSWORD = 'Seed123!'


export async function clearSeedData(prisma: PrismaClient): Promise<void> {
  await prisma.applicationHistory.deleteMany({
    where: { tenant: { slug: { startsWith: 'seed-emp-' } } },
  })
  await prisma.evaluation.deleteMany({
    where: { tenant: { slug: { startsWith: 'seed-emp-' } } },
  })
  await prisma.application.deleteMany({
    where: { tenant: { slug: { startsWith: 'seed-emp-' } } },
  })
  await prisma.job.deleteMany({
    where: { tenant: { slug: { startsWith: 'seed-emp-' } } },
  })
  await prisma.candidate.deleteMany({
    where: { user: { email: { endsWith: `@${EMAIL_DOMAIN}` } } },
  })
  await prisma.user.deleteMany({
    where: { email: { endsWith: `@${EMAIL_DOMAIN}` } },
  })
  await prisma.tenant.deleteMany({
    where: { slug: { startsWith: 'seed-emp-' } },
  })
}

export function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
}

export function seedEmail(local: string): string {
  return `${local}@${EMAIL_DOMAIN}`
}
