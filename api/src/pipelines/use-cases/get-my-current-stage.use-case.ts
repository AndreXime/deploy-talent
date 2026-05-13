import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

@Injectable()
export class GetMyCurrentStageUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(actor: Actor, applicationId: string) {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can read their own stage')
    }

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, candidate: { userId: actor.userId } },
      include: { currentStage: true },
    })
    if (!application) throw new NotFoundException('Application not found')

    const stage = application.currentStage
      ? {
          id: application.currentStage.id,
          position: application.currentStage.position,
          kind: application.currentStage.kind,
          name: application.currentStage.name,
          config: (application.currentStage.config as Record<string, unknown>) ?? {},
          required: application.currentStage.required,
        }
      : null

    const progress = application.currentJobStageId
      ? await this.prisma.applicationStageProgress.findUnique({
          where: {
            applicationId_jobStageId: {
              applicationId: application.id,
              jobStageId: application.currentJobStageId,
            },
          },
        })
      : null

    return { applicationId: application.id, stage, progress }
  }
}
