import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { JobStatus, type PrismaClient } from '../../../generated/prisma/client'
import { resolvePagination } from '../../common/dto/pagination-query.dto'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

export interface ListPublicJobsInput {
  page?: number
  limit?: number
}

@Injectable()
export class ListPublicJobsForTenantUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(input: ListPublicJobsInput) {
    const tenantId = this.tenantContext.getTenantId()
    if (tenantId === null) throw new BadRequestException('Missing tenant context')

    const { page, limit, skip, take } = resolvePagination(input.page, input.limit)

    const where = {
      status: { in: [JobStatus.PUBLISHED, JobStatus.PAUSED] },
    }

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.job.count({ where }),
    ])

    return { items, total, page, limit }
  }
}
