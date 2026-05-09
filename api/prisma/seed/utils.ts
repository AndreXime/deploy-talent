import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PrismaClient } from '../../generated/prisma/client'

export const EMAIL_DOMAIN = 'seed.local'
export const SEED_PASSWORD = 'Seed123!'

export async function writeMockDataFile(mockData: unknown): Promise<string> {
  const filePath = join(process.cwd(), 'prisma', 'seed', 'mock-data.json')

  await writeFile(filePath, `${JSON.stringify(mockData, null, 2)}\n`, 'utf8')

  return filePath
}

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

/**
 * Ordem de inserção intercalada: cada tenant aparece exatamente `jobsPerTenant` vezes.
 * Em cada rodada embaralha-se uma permutação de todos os tenants (sem repetir na mesma rodada);
 * entre rodadas pode coincidir o último da rodada anterior com o primeiro da próxima — no máximo 2 seguidos iguais.
 */
export function buildInterleavedTenantInsertionOrder(
  tenantCount: number,
  jobsPerTenant: number,
): number[] {
  const order: number[] = []
  const ids = Array.from({ length: tenantCount }, (_, k) => k + 1)
  for (let round = 0; round < jobsPerTenant; round += 1) {
    const perm = [...ids]
    shuffleInPlace(perm)
    order.push(...perm)
  }
  return order
}

export function seedEmail(local: string): string {
  return `${local}@${EMAIL_DOMAIN}`
}
