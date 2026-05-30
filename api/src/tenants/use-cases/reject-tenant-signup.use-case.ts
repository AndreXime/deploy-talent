import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

/**
 * Remove cadastro público ainda não aprovado (admin + empresa).
 */
@Injectable()
export class RejectTenantSignupUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId } })
    if (!tenant) throw new NotFoundException('Tenant not found')
    if (!tenant.signupPending)
      throw new BadRequestException('Tenant is not awaiting signup approval')

    await this.prisma.$transaction([
      this.prisma.user.deleteMany({ where: { tenantId } }),
      this.prisma.tenant.delete({ where: { id: tenantId } }),
    ])
  }
}
