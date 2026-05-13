import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

@Injectable()
export class GetCurrentTenantUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute() {
    const tenantId = this.tenantContext.requireTenantId()

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null, isActive: true, signupPending: false },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        signupPending: true,
        deletedAt: true,
        logoKey: true,
        bannerKey: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!tenant) throw new NotFoundException('Tenant not found')
    return tenant
  }
}
