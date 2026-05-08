import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { CreateEvaluationUseCase } from './create-evaluation.use-case'

describe('CreateEvaluationUseCase', () => {
  it('rejects candidate actor', async () => {
    const prisma = {
      application: { findFirst: jest.fn() },
      evaluation: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new CreateEvaluationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, { applicationId: 'a1' }),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when application not found', async () => {
    const prisma = {
      application: { findFirst: jest.fn(async () => null) },
      evaluation: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new CreateEvaluationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, { applicationId: 'a1' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
