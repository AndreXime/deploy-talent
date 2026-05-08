import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

@Injectable()
export class CreateRecruiterUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(input: { tenantId: string; email: string; password: string }) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: input.tenantId, deletedAt: null, isActive: true },
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

