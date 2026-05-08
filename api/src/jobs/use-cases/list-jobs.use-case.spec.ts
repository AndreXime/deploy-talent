import { BadRequestException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { ListJobsUseCase } from './list-jobs.use-case'

describe('ListJobsUseCase', () => {
  it('throws when tenant context is missing', async () => {
    const prisma = {
      job: { findMany: jest.fn(), count: jest.fn() },
    }
    const tenantContext = { getTenantId: () => null as string | null }
    const useCase = new ListJobsUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute({})).rejects.toBeInstanceOf(BadRequestException)
  })

  it('returns paginated result', async () => {
    const items = [{ id: 'j1' }]
    const prisma = {
      job: {
        findMany: jest.fn(async () => items),
        count: jest.fn(async () => 1),
      },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ListJobsUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    const result = await useCase.execute({ page: 1, limit: 20 })

    expect(result).toEqual({ items, total: 1, page: 1, limit: 20 })
  })
})
