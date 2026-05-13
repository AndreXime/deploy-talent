import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import type { Actor } from './application.actor'

@Injectable()
export class WithdrawMyApplicationUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(actor: Actor, applicationId: string) {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can withdraw applications')
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { userId: actor.userId, deletedAt: null },
      select: { id: true },
    })
    if (!candidate) throw new NotFoundException('Candidate profile not found')

    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, candidateId: candidate.id },
    })
    if (!app) throw new NotFoundException('Application not found')

    if (!canCandidateWithdraw(app.status)) {
      throw new ForbiddenException(`Cannot withdraw application in status ${app.status}`)
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.WITHDRAWN },
    })

    await this.prisma.applicationHistory.create({
      data: {
        tenantId: app.tenantId,
        applicationId,
        movedByUserId: actor.userId,
        fromStatus: app.status,
        toStatus: ApplicationStatus.WITHDRAWN,
        fromStage: null,
        toStage: null,
      },
    })

    return updated
  }
}

function canCandidateWithdraw(status: ApplicationStatus): boolean {
  return (
    status === ApplicationStatus.SOURCED ||
    status === ApplicationStatus.APPLIED ||
    status === ApplicationStatus.IN_PROGRESS
  )
}
