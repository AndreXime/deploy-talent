import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { GetEvaluationUseCase } from './get-evaluation.use-case'

describe('GetEvaluationUseCase', () => {
  it('throws when evaluation not found', async () => {
    const prisma = { evaluation: { findFirst: jest.fn(async () => null) } }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new GetEvaluationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, 'e1'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects candidate actor', async () => {
    const prisma = { evaluation: { findFirst: jest.fn() } }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new GetEvaluationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, 'e1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
