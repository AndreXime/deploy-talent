import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { MoveApplicationUseCase } from './move-application.use-case'

describe('MoveApplicationUseCase', () => {
  it('blocks terminal transitions', async () => {
    const prisma = {
      application: {
        findFirst: jest.fn(async () => ({
          id: 'a1',
          tenantId: 't1',
          status: ApplicationStatus.REJECTED,
          stage: null,
        })),
        update: jest.fn(),
      },
      applicationHistory: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new MoveApplicationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u2', role: UserRole.RECRUITER }, 'a1', {
        status: ApplicationStatus.IN_PROGRESS,
      }),
    ).rejects.toThrow('Invalid application transition')
  })

  it('throws when application not found', async () => {
    const prisma = {
      application: {
        findFirst: jest.fn(async () => null),
        update: jest.fn(),
      },
      applicationHistory: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new MoveApplicationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u2', role: UserRole.RECRUITER }, 'a1', {
        status: ApplicationStatus.IN_PROGRESS,
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects non-recruiter actor', async () => {
    const prisma = {
      application: { findFirst: jest.fn(), update: jest.fn() },
      applicationHistory: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new MoveApplicationUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, 'a1', {
        status: ApplicationStatus.IN_PROGRESS,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
