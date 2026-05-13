import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ApplicationStatus,
  JobStatus,
  type PrismaClient,
  UserRole,
} from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { CandidateApplicationEmailNotifier } from '../candidate-application-email.notifier'
import type { ApplyDto } from '../dto/apply.dto'
import type { Actor } from './application.actor'

@Injectable()
export class ApplyToJobUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly candidateEmails: CandidateApplicationEmailNotifier,
  ) {}

  async execute(actor: Actor, input: ApplyDto) {
    if (actor.role !== UserRole.CANDIDATE) throw new ForbiddenException('Only candidates can apply')

    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const candidate = await this.prisma.candidate.findFirst({
      where: { userId: actor.userId, deletedAt: null },
      select: { id: true, name: true, email: true },
    })
    if (!candidate) throw new NotFoundException('Candidate profile not found')

    const job = await this.prisma.job.findFirst({
      where: { id: input.jobId, tenantId },
      select: {
        id: true,
        status: true,
        title: true,
        tenant: { select: { name: true } },
        stages: { orderBy: { position: 'asc' }, take: 1, select: { id: true, name: true } },
      },
    })
    if (!job) throw new NotFoundException('Job not found')
    if (job.status !== JobStatus.PUBLISHED && job.status !== JobStatus.PAUSED) {
      throw new ForbiddenException('Job is not accepting applications')
    }

    const firstStage = job.stages[0] ?? null

    const app = await this.prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          tenantId,
          jobId: job.id,
          candidateId: candidate.id,
          status: ApplicationStatus.APPLIED,
          appliedAt: new Date(),
          currentJobStageId: firstStage?.id ?? null,
        },
      })

      await tx.applicationHistory.create({
        data: {
          tenantId,
          applicationId: created.id,
          movedByUserId: actor.userId,
          fromStatus: ApplicationStatus.APPLIED,
          toStatus: ApplicationStatus.APPLIED,
          fromStage: null,
          toStage: firstStage?.name ?? null,
        },
      })

      if (firstStage) {
        await tx.applicationStageProgress.create({
          data: {
            applicationId: created.id,
            jobStageId: firstStage.id,
            status: 'PENDING',
          },
        })
      }

      return created
    })

    await this.candidateEmails.notifyApplicationSubmitted({
      recipientEmail: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title,
      companyName: job.tenant.name,
    })

    return app
  }
}
