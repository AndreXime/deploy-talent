import { Inject, Injectable } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import type { CreateTenantDto } from '../dto/create-tenant.dto'

@Injectable()
export class CreateTenantUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(input: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        isActive: input.isActive ?? true,
        signupPending: false,
      },
    })
  }
}
