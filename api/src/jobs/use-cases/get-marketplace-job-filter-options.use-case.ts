import { Inject, Injectable } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { buildMarketplaceJobsWhere } from '../utils/public-job-listing-where'

export interface MarketplaceTenantFilterOption {
  id: string
  name: string
}

export interface MarketplaceJobFilterOptionsResult {
  modalities: string[]
  locations: string[]
  seniorities: string[]
  tenants: MarketplaceTenantFilterOption[]
}

@Injectable()
export class GetMarketplaceJobFilterOptionsUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(): Promise<MarketplaceJobFilterOptionsResult> {
    const where = buildMarketplaceJobsWhere({})

    const [modalityRows, locationRows, seniorityRows, tenantJobRows] = await Promise.all([
      this.prisma.job.findMany({
        where,
        distinct: ['modality'],
        select: { modality: true },
        orderBy: { modality: 'asc' },
      }),
      this.prisma.job.findMany({
        where,
        distinct: ['location'],
        select: { location: true },
        orderBy: { location: 'asc' },
      }),
      this.prisma.job.findMany({
        where,
        distinct: ['seniority'],
        select: { seniority: true },
        orderBy: { seniority: 'asc' },
      }),
      this.prisma.job.findMany({
        where,
        distinct: ['tenantId'],
        select: {
          tenant: { select: { id: true, name: true } },
        },
      }),
    ])

    const tenants = tenantJobRows
      .map((row) => row.tenant)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }))

    return {
      modalities: modalityRows.map((r) => r.modality),
      locations: locationRows.map((r) => r.location),
      seniorities: seniorityRows.map((r) => r.seniority),
      tenants,
    }
  }
}
