import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PipelineStageKind, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { validateInterviewLinkRecruiterPayload } from '../stage-config'

@Injectable()
export class SetInterviewLinkUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, applicationId: string, jobStageId: string, payload: unknown) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can set interview link')
    }
    const tenantId = this.tenantContext.requireTenantId()

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId },
      select: { id: true, jobId: true },
    })
    if (!application) throw new NotFoundException('Application not found')

    const stage = await this.prisma.jobStage.findUnique({
      where: { id: jobStageId },
      select: { id: true, jobId: true, kind: true },
    })
    if (!stage) throw new NotFoundException('Stage not found')
    if (stage.jobId !== application.jobId) {
      throw new BadRequestException('Stage pertence a outra vaga')
    }
    if (stage.kind !== PipelineStageKind.INTERVIEW_LINK) {
      throw new BadRequestException('Etapa não é do tipo INTERVIEW_LINK')
    }

    const normalized = validateInterviewLinkRecruiterPayload(payload)

    return this.prisma.applicationStageProgress.upsert({
      where: {
        applicationId_jobStageId: {
          applicationId: application.id,
          jobStageId: stage.id,
        },
      },
      create: {
        applicationId: application.id,
        jobStageId: stage.id,
        status: 'PENDING',
        submittedData: normalized as object,
      },
      update: {
        submittedData: normalized as object,
      },
    })
  }
}
