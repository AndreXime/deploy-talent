import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { EnvService } from '../../infra/env/env.service'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { validateStageSubmission } from '../stage-config'

@Injectable()
export class SubmitCurrentStageUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly env: EnvService,
  ) {}

  async execute(actor: Actor, applicationId: string, payload: unknown) {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can submit stage data')
    }

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, candidate: { userId: actor.userId } },
      include: { currentStage: true },
    })
    if (!application) throw new NotFoundException('Application not found')

    if (
      application.status === ApplicationStatus.REJECTED ||
      application.status === ApplicationStatus.WITHDRAWN ||
      application.status === ApplicationStatus.HIRED
    ) {
      throw new BadRequestException('Application já terminada')
    }

    const stage = application.currentStage
    if (!stage || !application.currentJobStageId) {
      throw new BadRequestException('Sem etapa actual para submeter')
    }

    const normalized = validateStageSubmission(stage.kind, stage.config, payload, {
      s3MaxUploadBytes: this.env.s3MaxUploadBytes,
    })

    return this.prisma.applicationStageProgress.upsert({
      where: {
        applicationId_jobStageId: {
          applicationId: application.id,
          jobStageId: application.currentJobStageId,
        },
      },
      create: {
        applicationId: application.id,
        jobStageId: application.currentJobStageId,
        status: 'COMPLETED',
        submittedData: normalized as object,
        completedAt: new Date(),
        completedByUserId: actor.userId,
      },
      update: {
        status: 'COMPLETED',
        submittedData: normalized as object,
        completedAt: new Date(),
        completedByUserId: actor.userId,
      },
    })
  }
}
