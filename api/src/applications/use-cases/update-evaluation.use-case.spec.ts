import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { UpdateEvaluationUseCase } from './update-evaluation.use-case'

describe('UpdateEvaluationUseCase', () => {
  it('throws when evaluation not found', async () => {
    const prisma = {
      evaluation: {
        findFirst: jest.fn(async () => null),
        update: jest.fn(),
      },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new UpdateEvaluationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, 'e1', { score: 4 }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects candidate actor', async () => {
    const prisma = {
      evaluation: { findFirst: jest.fn(), update: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new UpdateEvaluationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, 'e1', {}),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
