import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { JobStatus, type PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { UpdateJobUseCase } from './update-job.use-case'

describe('UpdateJobUseCase', () => {
  it('throws when job is closed', async () => {
    const prisma = {
      job: {
        findFirst: jest.fn(async () => ({
          id: 'j1',
          tenantId: 't1',
          status: JobStatus.CLOSED,
        })),
        update: jest.fn(),
      },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new UpdateJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute('j1', { title: 'New' })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when job not found', async () => {
    const prisma = {
      job: {
        findFirst: jest.fn(async () => null),
        update: jest.fn(),
      },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new UpdateJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute('j1', {})).rejects.toBeInstanceOf(NotFoundException)
  })
})
