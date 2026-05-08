import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { ListEvaluationsForApplicationUseCase } from './list-evaluations-for-application.use-case'

describe('ListEvaluationsForApplicationUseCase', () => {
  it('throws when application not found', async () => {
    const prisma = {
      application: { findFirst: jest.fn(async () => null) },
      evaluation: { findMany: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ListEvaluationsForApplicationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, 'a1'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects candidate actor', async () => {
    const prisma = {
      application: { findFirst: jest.fn() },
      evaluation: { findMany: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ListEvaluationsForApplicationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, 'a1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when tenant context missing', async () => {
    const prisma = {
      application: { findFirst: jest.fn(async () => ({ id: 'a1' })) },
      evaluation: { findMany: jest.fn() },
    }
    const tenantContext = { getTenantId: () => null as string | null }
    const useCase = new ListEvaluationsForApplicationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, 'a1'),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
