import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

@Injectable()
export class SuspendTenantUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId } })
    if (!tenant) throw new NotFoundException('Tenant not found')
    if (tenant.deletedAt) throw new BadRequestException('Tenant is deleted')
    return this.prisma.tenant.update({ where: { id: tenantId }, data: { isActive: false } })
  }
}

