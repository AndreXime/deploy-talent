import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import type { ApplicationStatus, PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { CandidateProfileReadService } from '../../candidates/candidate-profile-read.service'
import { resolvePagination } from '../../common/dto/pagination-query.dto'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { Actor } from './application.actor'

export interface ListApplicationsForTenantInput {
  page?: number
  limit?: number
  status?: ApplicationStatus
  jobId?: string
}

@Injectable()
export class ListApplicationsForTenantUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly candidateRead: CandidateProfileReadService,
  ) {}

  async execute(actor: Actor, input: ListApplicationsForTenantInput = {}) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can list applications')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const { page, limit, skip, take } = resolvePagination(input.page, input.limit)
    const where: { status?: ApplicationStatus; jobId?: string } = {}
    if (input.status !== undefined) where.status = input.status
    if (input.jobId !== undefined) where.jobId = input.jobId

    const [rows, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: { candidate: true, job: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.application.count({ where }),
    ])

    const items = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        candidate: await this.candidateRead.toApiRead(row.candidate),
      })),
    )

    return { items, total, page, limit }
  }
}
