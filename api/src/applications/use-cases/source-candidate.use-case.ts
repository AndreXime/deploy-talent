import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { EnvService } from '../../infra/env/env.service'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { InvitationEmailNotifier } from '../../invitations/invitation-email.notifier'
import { generateInvitationToken } from '../../invitations/invitation-token'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { SourceDto } from '../dto/source.dto'
import type { Actor } from './application.actor'

export type SourceCandidateOutcome = 'CANDIDATE_INVITED' | 'JOB_LINK_SENT' | 'ALREADY_APPLIED'

export interface SourceCandidateResult {
  outcome: SourceCandidateOutcome
  applicationId?: string
  invitationId?: string
}

@Injectable()
export class SourceCandidateUseCase {
  private readonly logger = new Logger(SourceCandidateUseCase.name)

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly env: EnvService,
    private readonly invitationNotifier: InvitationEmailNotifier,
  ) {}

  async execute(actor: Actor, input: SourceDto): Promise<SourceCandidateResult> {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can source')
    }

    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const email = input.candidateEmail.trim().toLowerCase()
    const name = input.candidateName.trim()

    const job = await this.prisma.job.findFirst({
      where: { id: input.jobId, tenantId },
      select: { id: true, title: true, tenantId: true },
    })
    if (!job) throw new NotFoundException('Job not found')

    const jobUrl = this.buildPublicJobUrl(job.tenantId, job.id)

    const user = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true, role: true },
    })

    if (!user) {
      return this.inviteNewCandidate({
        actorUserId: actor.userId,
        tenantId,
        jobTitle: job.title,
        jobUrl,
        email,
        name,
      })
    }

    if (user.role !== UserRole.CANDIDATE) {
      throw new ConflictException('Email pertence a um utilizador interno da plataforma')
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    })
    if (!candidate) {
      throw new ConflictException('Utilizador candidato sem perfil activo')
    }

    const existingApplication = await this.prisma.application.findFirst({
      where: { jobId: job.id, candidateId: candidate.id },
      select: { id: true },
    })
    if (existingApplication) {
      return { outcome: 'ALREADY_APPLIED', applicationId: existingApplication.id }
    }

    await this.invitationNotifier.notifyCandidateNudgedForJob({
      recipientEmail: email,
      tenantName: await this.tenantName(tenantId),
      jobTitle: job.title,
      jobUrl,
    })

    return { outcome: 'JOB_LINK_SENT' }
  }

  private async inviteNewCandidate(params: {
    actorUserId: string
    tenantId: string
    jobTitle: string
    jobUrl: string
    email: string
    name: string
  }): Promise<SourceCandidateResult> {
    await this.prisma.invitation.updateMany({
      where: {
        email: params.email,
        role: UserRole.CANDIDATE,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    const { raw, hash } = generateInvitationToken()
    const expiresAt = new Date(Date.now() + this.env.invitationTtlHours * 60 * 60 * 1000)

    const invitation = await this.prisma.invitation.create({
      data: {
        email: params.email,
        name: params.name,
        role: UserRole.CANDIDATE,
        tenantId: null,
        tokenHash: hash,
        invitedByUserId: params.actorUserId,
        expiresAt,
      },
      select: { id: true },
    })

    try {
      await this.invitationNotifier.notifyCandidateSourcedForJob({
        recipientEmail: params.email,
        recipientName: params.name,
        tenantName: await this.tenantName(params.tenantId),
        jobTitle: params.jobTitle,
        jobUrl: params.jobUrl,
        rawToken: raw,
        expiresAt,
      })
    } catch (err) {
      await this.prisma.invitation
        .update({
          where: { id: invitation.id },
          data: { revokedAt: new Date() },
        })
        .catch((rollbackErr) => {
          this.logger.error(
            `Falha a reverter convite ${invitation.id} após erro de envio`,
            rollbackErr as Error,
          )
        })
      throw err
    }

    return { outcome: 'CANDIDATE_INVITED', invitationId: invitation.id }
  }

  private async tenantName(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { name: true },
    })
    return tenant?.name ?? 'a empresa'
  }

  private buildPublicJobUrl(tenantId: string, jobId: string): string {
    return `${this.env.webBaseUrl}/carreiras/${tenantId}/vagas/${jobId}`
  }
}
