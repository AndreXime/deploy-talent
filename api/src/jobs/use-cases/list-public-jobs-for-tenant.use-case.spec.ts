import { BadRequestException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { ListPublicJobsForTenantUseCase } from './list-public-jobs-for-tenant.use-case'

describe('ListPublicJobsForTenantUseCase', () => {
  it('throws when tenant context is missing', async () => {
    const prisma = { job: { findMany: jest.fn(), count: jest.fn() } }
    const tenantContext = { getTenantId: () => null as string | null }
    const useCase = new ListPublicJobsForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute({})).rejects.toBeInstanceOf(BadRequestException)
  })

  it('filters published and paused jobs', async () => {
    const prisma = {
      job: {
        findMany: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ListPublicJobsForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await useCase.execute({ page: 1, limit: 10 })

    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['PUBLISHED', 'PAUSED'] } },
      }),
    )
  })
})
