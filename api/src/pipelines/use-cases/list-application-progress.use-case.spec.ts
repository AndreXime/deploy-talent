import { ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { ListApplicationProgressUseCase } from './list-application-progress.use-case'

describe('ListApplicationProgressUseCase', () => {
  const actor = { userId: 'u1', role: UserRole.RECRUITER, tenantId: 't1' }

  it('rejects candidates', async () => {
    const useCase = new ListApplicationProgressUseCase(
      {} as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE, tenantId: null }, 'a1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when application not found', async () => {
    const prisma = {
      application: { findFirst: jest.fn(async () => null) },
      applicationStageProgress: { findMany: jest.fn() },
    }
    const useCase = new ListApplicationProgressUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    await expect(useCase.execute(actor, 'a1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns stage progress ordered by position', async () => {
    const progress = [{ id: 'p1', applicationId: 'a1', jobStageId: 's1' }]
    const prisma = {
      application: { findFirst: jest.fn(async () => ({ id: 'a1' })) },
      applicationStageProgress: { findMany: jest.fn(async () => progress) },
    }
    const useCase = new ListApplicationProgressUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    const result = await useCase.execute(actor, 'a1')
    expect(result).toEqual(progress)
  })
})
