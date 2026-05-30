import { ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { JobStatus } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { ListJobStagesUseCase } from './list-job-stages.use-case'

describe('ListJobStagesUseCase', () => {
  it('throws when job not found', async () => {
    const prisma = {
      job: { findUnique: jest.fn(async () => null) },
      jobStage: { findMany: jest.fn() },
    }
    const useCase = new ListJobStagesUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    await expect(useCase.execute('j1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws when job belongs to another tenant', async () => {
    const prisma = {
      job: { findUnique: jest.fn(async () => ({ tenantId: 'other' })) },
      jobStage: { findMany: jest.fn() },
    }
    const useCase = new ListJobStagesUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    await expect(useCase.execute('j1')).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('returns ordered stages', async () => {
    const stages = [
      { id: 's1', position: 0, kind: 'MANUAL', name: 'Triagem', config: {}, required: true },
    ]
    const prisma = {
      job: { findUnique: jest.fn(async () => ({ tenantId: 't1', status: JobStatus.DRAFT })) },
      jobStage: { findMany: jest.fn(async () => stages) },
    }
    const useCase = new ListJobStagesUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    const result = await useCase.execute('j1')
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Triagem')
  })
})
