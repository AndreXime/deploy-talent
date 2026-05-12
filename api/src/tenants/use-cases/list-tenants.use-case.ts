import { Inject, Injectable } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

@Injectable()
export class ListTenantsUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } })
  }
}
