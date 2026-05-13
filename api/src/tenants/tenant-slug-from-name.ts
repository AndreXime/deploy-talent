import { ConflictException } from '@nestjs/common'
import type { PrismaClient } from '../../generated/prisma/client'

export const TENANT_SLUG_MAX_LENGTH = 80

/**
 * Gera um slug inicial válido para `Tenant.slug` a partir do nome comercial.
 */
export function companyNameToTenantSlugBase(companyName: string): string {
  const trimmed = companyName.trim().toLowerCase()
  const withoutDiacritics = trimmed.normalize('NFD').replace(/\p{M}/gu, '')
  const raw = withoutDiacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const base = raw.slice(0, TENANT_SLUG_MAX_LENGTH)
  return base.length > 0 ? base : 'empresa'
}

/**
 * Escolhe um `slug` único: `base`, `base-2`, `base-3`, … (respeitando o limite de caracteres).
 */
export async function allocateUniqueTenantSlug(
  prisma: Pick<PrismaClient, 'tenant'>,
  companyName: string,
): Promise<string> {
  const base = companyNameToTenantSlugBase(companyName)

  for (let i = 0; i < 10_000; i++) {
    const slug =
      i === 0
        ? base.slice(0, TENANT_SLUG_MAX_LENGTH)
        : (() => {
            const suffix = `-${i + 1}`
            const headLen = Math.max(1, TENANT_SLUG_MAX_LENGTH - suffix.length)
            return base.slice(0, headLen) + suffix
          })()

    const clash = await prisma.tenant.findFirst({ where: { slug }, select: { id: true } })
    if (!clash) return slug
  }

  throw new ConflictException('Unable to assign company URL')
}
