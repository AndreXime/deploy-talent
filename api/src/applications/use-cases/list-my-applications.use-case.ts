import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import type { Actor } from './application.actor'

@Injectable()
export class ListMyApplicationsUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(actor: Actor) {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can list own applications')
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { userId: actor.userId, deletedAt: null },
      select: { id: true },
    })
    if (!candidate) throw new NotFoundException('Candidate profile not found')

    return this.prisma.application.findMany({
      where: { candidateId: candidate.id },
      include: { job: true, tenant: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
}

