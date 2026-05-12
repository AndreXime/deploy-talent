import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { StorageService } from '../../infra/storage/storage.service'
import { assertKeyMatchesTenant } from '../../media/media-key.util'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { UpdateTenantBrandingDto } from '../dto/update-tenant-branding.dto'

@Injectable()
export class UpdateTenantBrandingUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly storage: StorageService,
  ) {}

  async execute(actor: Actor, input: UpdateTenantBrandingDto) {
    if (actor.role !== UserRole.TENANT_ADMIN && actor.role !== UserRole.RECRUITER) {
      throw new BadRequestException('Only tenant users can update branding')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    if (input.logoKey === undefined && input.bannerKey === undefined) {
      throw new BadRequestException('Provide logoKey and/or bannerKey')
    }

    const current = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { logoKey: true, bannerKey: true },
    })
    if (!current) throw new BadRequestException('Tenant not found')

    const data: { logoKey?: string | null; bannerKey?: string | null } = {}

    if (input.logoKey !== undefined) {
      const next = input.logoKey.trim() === '' ? null : input.logoKey.trim()
      if (next !== null) assertKeyMatchesTenant(next, tenantId, 'logo')
      data.logoKey = next
      if (current.logoKey && current.logoKey !== next) {
        void this.storage.deleteObject(current.logoKey).catch(() => undefined)
      }
    }

    if (input.bannerKey !== undefined) {
      const next = input.bannerKey.trim() === '' ? null : input.bannerKey.trim()
      if (next !== null) assertKeyMatchesTenant(next, tenantId, 'banner')
      data.bannerKey = next
      if (current.bannerKey && current.bannerKey !== next) {
        void this.storage.deleteObject(current.bannerKey).catch(() => undefined)
      }
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    })
  }
}
