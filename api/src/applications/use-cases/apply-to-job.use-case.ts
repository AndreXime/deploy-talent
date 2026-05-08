import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, JobStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { CandidateApplicationEmailNotifier } from '../candidate-application-email.notifier'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
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
      },
    })
    if (!job) throw new NotFoundException('Job not found')
    if (job.status !== JobStatus.PUBLISHED && job.status !== JobStatus.PAUSED) {
      throw new ForbiddenException('Job is not accepting applications')
    }

    const app = await this.prisma.application.create({
      data: {
        tenantId,
        jobId: job.id,
        candidateId: candidate.id,
        status: ApplicationStatus.APPLIED,
        appliedAt: new Date(),
      },
    })

    await this.prisma.applicationHistory.create({
      data: {
        tenantId,
        applicationId: app.id,
        movedByUserId: actor.userId,
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.APPLIED,
      },
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

