import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

@Injectable()
export class UnsaveJobUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(actor: Actor, jobId: string): Promise<void> {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can remove saved jobs')
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { userId: actor.userId, deletedAt: null },
      select: { id: true },
    })
    if (!candidate) throw new NotFoundException('Candidate profile not found')

    const result = await this.prisma.savedJob.deleteMany({
      where: { candidateId: candidate.id, jobId },
    })

    if (result.count === 0) {
      throw new NotFoundException('Saved job not found')
    }
  }
}
