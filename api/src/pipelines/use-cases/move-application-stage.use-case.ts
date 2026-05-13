import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

export interface MoveApplicationStageInput {
  applicationId: string
  jobStageId: string
}

/**
 * Move o cursor da etapa actual de uma `Application` para outro `JobStage`
 * pertencente à sua vaga. Cria (idempotente) a linha de `ApplicationStageProgress`
 * para a nova etapa em `PENDING` se ainda não existir, e regista a transição
 * em `ApplicationHistory` com os nomes das etapas como snapshot.
 */
@Injectable()
export class MoveApplicationStageUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, input: MoveApplicationStageInput) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can move stages')
    }
    const tenantId = this.tenantContext.requireTenantId()

    const application = await this.prisma.application.findFirst({
      where: { id: input.applicationId, tenantId },
      include: {
        currentStage: { select: { id: true, name: true } },
      },
    })
    if (!application) throw new NotFoundException('Application not found')

    const target = await this.prisma.jobStage.findUnique({
      where: { id: input.jobStageId },
      select: { id: true, jobId: true, name: true },
    })
    if (!target) throw new NotFoundException('Stage not found')
    if (target.jobId !== application.jobId) {
      throw new BadRequestException('Stage pertence a outra vaga')
    }

    if (application.currentJobStageId === target.id) {
      return this.prisma.applicationStageProgress.findUniqueOrThrow({
        where: {
          applicationId_jobStageId: {
            applicationId: application.id,
            jobStageId: target.id,
          },
        },
      })
    }

    const fromStageName = application.currentStage?.name ?? null

    return this.prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: application.id },
        data: {
          currentJobStageId: target.id,
          status:
            application.status === ApplicationStatus.APPLIED ||
            application.status === ApplicationStatus.SOURCED
              ? ApplicationStatus.IN_PROGRESS
              : application.status,
        },
      })

      const progress = await tx.applicationStageProgress.upsert({
        where: {
          applicationId_jobStageId: {
            applicationId: application.id,
            jobStageId: target.id,
          },
        },
        create: {
          applicationId: application.id,
          jobStageId: target.id,
          status: 'PENDING',
        },
        update: {},
      })

      await tx.applicationHistory.create({
        data: {
          tenantId,
          applicationId: application.id,
          movedByUserId: actor.userId,
          fromStatus: application.status,
          toStatus:
            application.status === ApplicationStatus.APPLIED ||
            application.status === ApplicationStatus.SOURCED
              ? ApplicationStatus.IN_PROGRESS
              : application.status,
          fromStage: fromStageName,
          toStage: target.name,
        },
      })

      return progress
    })
  }
}
