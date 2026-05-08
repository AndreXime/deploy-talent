import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { SourceDto } from '../dto/source.dto'
import type { Actor } from './application.actor'

@Injectable()
export class SourceCandidateUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, input: SourceDto) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can source')
    }

    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing X-Tenant-ID header')

    const job = await this.prisma.job.findFirst({
      where: { id: input.jobId, tenantId },
      select: { id: true },
    })
    if (!job) throw new NotFoundException('Job not found')

    const candidate =
      (await this.prisma.candidate.findFirst({
        where: { email: input.candidateEmail, deletedAt: null },
        select: { id: true },
      })) ??
      (await this.prisma.candidate.create({
        data: {
          user: {
            create: {
              email: input.candidateEmail,
              passwordHash: await bcrypt.hash(cryptoRandomPassword(), 10),
              role: UserRole.CANDIDATE,
            },
          },
          name: input.candidateName,
          email: input.candidateEmail,
        },
        select: { id: true },
      }))

    const app = await this.prisma.application.create({
      data: {
        tenantId,
        jobId: job.id,
        candidateId: candidate.id,
        status: ApplicationStatus.SOURCED,
        stage: input.stage,
        sourcedByUserId: actor.userId,
      },
    })

    await this.prisma.applicationHistory.create({
      data: {
        tenantId,
        applicationId: app.id,
        movedByUserId: actor.userId,
        fromStatus: ApplicationStatus.SOURCED,
        toStatus: ApplicationStatus.SOURCED,
        fromStage: null,
        toStage: input.stage ?? null,
      },
    })

    return app
  }
}

function cryptoRandomPassword(): string {
  return `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
}

