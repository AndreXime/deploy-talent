import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { CandidateApplicationEmailNotifier } from '../../infra/email/candidate-application-email.notifier'
import type { MoveApplicationDto } from '../dto/move-application.dto'
import type { Actor } from './application.actor'

@Injectable()
export class MoveApplicationUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly candidateEmails: CandidateApplicationEmailNotifier,
  ) {}

  async execute(actor: Actor, applicationId: string, input: MoveApplicationDto) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can move applications')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId },
      include: {
        candidate: { select: { name: true, email: true } },
        job: { select: { title: true } },
        tenant: { select: { name: true } },
      },
    })
    if (!app) throw new NotFoundException('Application not found')

    if (!isValidApplicationTransition(app.status, input.status)) {
      throw new ForbiddenException(
        `Invalid application transition: ${app.status} -> ${input.status}`,
      )
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: input.status,
      },
    })

    await this.prisma.applicationHistory.create({
      data: {
        tenantId,
        applicationId,
        movedByUserId: actor.userId,
        fromStatus: app.status,
        toStatus: input.status,
        fromStage: null,
        toStage: null,
      },
    })

    if (app.status !== input.status) {
      const ctx = {
        recipientEmail: app.candidate.email,
        candidateName: app.candidate.name,
        jobTitle: app.job.title,
        companyName: app.tenant.name,
      }
      if (input.status === ApplicationStatus.HIRED) {
        await this.candidateEmails.notifyHired(ctx)
      } else if (input.status === ApplicationStatus.REJECTED) {
        await this.candidateEmails.notifyRejected(ctx)
      }
    }

    return updated
  }
}

function isValidApplicationTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to) return true
  const terminal = new Set<ApplicationStatus>([
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
    ApplicationStatus.HIRED,
  ])
  if (terminal.has(from)) return false

  switch (from) {
    case ApplicationStatus.SOURCED:
      return (
        to === ApplicationStatus.IN_PROGRESS ||
        to === ApplicationStatus.REJECTED ||
        to === ApplicationStatus.WITHDRAWN
      )
    case ApplicationStatus.APPLIED:
      return (
        to === ApplicationStatus.IN_PROGRESS ||
        to === ApplicationStatus.REJECTED ||
        to === ApplicationStatus.WITHDRAWN
      )
    case ApplicationStatus.IN_PROGRESS:
      return (
        to === ApplicationStatus.REJECTED ||
        to === ApplicationStatus.WITHDRAWN ||
        to === ApplicationStatus.HIRED
      )
    case ApplicationStatus.REJECTED:
    case ApplicationStatus.WITHDRAWN:
    case ApplicationStatus.HIRED:
      return false
  }
}
