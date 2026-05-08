import { NotFoundException } from '@nestjs/common'
import { JobStatus, type PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { GetPublicJobUseCase } from './get-public-job.use-case'

describe('GetPublicJobUseCase', () => {
  it('throws when job is not public', async () => {
    const prisma = { job: { findFirst: jest.fn(async () => null) } }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new GetPublicJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute('j1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns published job', async () => {
    const job = { id: 'j1', status: JobStatus.PUBLISHED }
    const prisma = { job: { findFirst: jest.fn(async () => job) } }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new GetPublicJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute('j1')).resolves.toEqual(job)
  })
})
