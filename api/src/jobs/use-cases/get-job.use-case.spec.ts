import { BadRequestException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { GetJobUseCase } from './get-job.use-case'

describe('GetJobUseCase', () => {
  it('throws when tenant context is missing', async () => {
    const prisma = { job: { findFirst: jest.fn() } }
    const tenantContext = { getTenantId: () => null as string | null }
    const useCase = new GetJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute('j1')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('throws when job not found', async () => {
    const prisma = { job: { findFirst: jest.fn(async () => null) } }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new GetJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute('j1')).rejects.toBeInstanceOf(NotFoundException)
  })
})
