import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

@Injectable()
export class CreateRecruiterUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(input: { email: string; password: string }) {
    const tenantId = this.tenantContext.requireTenantId()
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null, isActive: true },
      select: { id: true },
    })
    if (!tenant) throw new BadRequestException('Invalid tenant')

    const existing = await this.prisma.user.findFirst({ where: { email: input.email } })
    if (existing) throw new BadRequestException('Email already in use')

    const passwordHash = await bcrypt.hash(input.password, 10)
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: UserRole.RECRUITER,
        tenantId: tenant.id,
      },
    })

    return { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role }
  }
}

