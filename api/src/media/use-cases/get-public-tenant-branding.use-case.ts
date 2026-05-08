import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { StorageService } from '../../infra/storage/storage.service'

export interface PublicTenantBrandingResult {
  logo: { url: string; expiresAt: Date } | null
  banner: { url: string; expiresAt: Date } | null
}

@Injectable()
export class GetPublicTenantBrandingUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly storage: StorageService,
  ) {}

  async execute(tenantId: string): Promise<PublicTenantBrandingResult> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null, isActive: true },
      select: { logoKey: true, bannerKey: true },
    })
    if (!tenant) throw new NotFoundException('Tenant not found')

    const ttl = 300

    const [logo, banner] = await Promise.all([
      tenant.logoKey
        ? this.storage.presignDownload({ key: tenant.logoKey, expiresInSeconds: ttl })
        : null,
      tenant.bannerKey
        ? this.storage.presignDownload({ key: tenant.bannerKey, expiresInSeconds: ttl })
        : null,
    ])

    return {
      logo: logo ? { url: logo.url, expiresAt: logo.expiresAt } : null,
      banner: banner ? { url: banner.url, expiresAt: banner.expiresAt } : null,
    }
  }
}
