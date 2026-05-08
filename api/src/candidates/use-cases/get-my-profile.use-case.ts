import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

@Injectable()
export class GetMyProfileUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(userId: string) {
    const profile = await this.prisma.candidate.findFirst({
      where: { userId, deletedAt: null },
    })
    if (!profile) throw new NotFoundException('Candidate profile not found')
    return profile
  }
}

