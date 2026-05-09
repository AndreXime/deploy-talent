import { Inject, Injectable } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { resolvePagination } from '../../common/dto/pagination-query.dto'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import {
  buildMarketplaceJobsWhere,
  type PublicJobListingTextFilters,
} from '../utils/public-job-listing-where'

const tenantSnippetSelect = {
  id: true,
  name: true,
  slug: true,
  logoKey: true,
  bannerKey: true,
} as const

export interface ListMarketplaceJobsInput extends PublicJobListingTextFilters {
  page?: number
  limit?: number
  tenantId?: string
}

@Injectable()
export class ListMarketplaceJobsUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(input: ListMarketplaceJobsInput) {
    const { page, limit, skip, take } = resolvePagination(input.page, input.limit)
    const where = buildMarketplaceJobsWhere({
      q: input.q,
      modality: input.modality,
      location: input.location,
      seniority: input.seniority,
      tenantId: input.tenantId,
    })

    const [rows, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { tenant: { select: tenantSnippetSelect } },
      }),
      this.prisma.job.count({ where }),
    ])

    const items = rows.map(({ tenant, ...job }) => ({
      job,
      tenant,
    }))

    return { items, total, page, limit }
  }
}
