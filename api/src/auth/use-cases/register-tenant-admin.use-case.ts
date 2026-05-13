import { ConflictException, Inject, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { allocateUniqueTenantSlug } from '../../tenants/tenant-slug-from-name'

export interface RegisterTenantAdminResult {
  status: 'pending_approval'
}

@Injectable()
export class RegisterTenantAdminUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(input: {
    companyName: string
    email: string
    password: string
  }): Promise<RegisterTenantAdminResult> {
    const email = input.email.trim().toLowerCase()
    const companyName = input.companyName.trim()

    const emailTaken = await this.prisma.user.findFirst({ where: { email }, select: { id: true } })
    if (emailTaken) throw new ConflictException('Email already in use')

    const passwordHash = await bcrypt.hash(input.password, 10)

    await this.prisma.$transaction(async (tx) => {
      const slug = await allocateUniqueTenantSlug(tx, companyName)

      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          isActive: false,
          signupPending: true,
        },
      })

      await tx.user.create({
        data: {
          email,
          passwordHash,
          role: UserRole.TENANT_ADMIN,
          tenantId: tenant.id,
        },
      })
    })

    return { status: 'pending_approval' }
  }
}
