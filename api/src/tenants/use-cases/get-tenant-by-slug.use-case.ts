import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

@Injectable()
export class GetTenantBySlugUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(slug: string) {
    const normalized = slug.trim()
    if (normalized.length === 0) {
      throw new NotFoundException('Tenant not found')
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        slug: normalized,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoKey: true,
        bannerKey: true,
      },
    })

    if (!tenant) throw new NotFoundException('Tenant not found')
    return tenant
  }
}
