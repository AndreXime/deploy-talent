import { ForbiddenException } from '@nestjs/common'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { WithdrawMyApplicationUseCase } from './withdraw-my-application.use-case'

describe('WithdrawMyApplicationUseCase', () => {
  it('rejects non-candidate', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn() },
      application: { findFirst: jest.fn(), update: jest.fn() },
      applicationHistory: { create: jest.fn() },
    }
    const useCase = new WithdrawMyApplicationUseCase(prisma as unknown as PrismaClient)

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, 'a1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejects withdraw from hired status', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => ({ id: 'c1' })) },
      application: {
        findFirst: jest.fn(async () => ({
          id: 'a1',
          tenantId: 't1',
          status: ApplicationStatus.HIRED,
          stage: null,
        })),
        update: jest.fn(),
      },
      applicationHistory: { create: jest.fn() },
    }
    const useCase = new WithdrawMyApplicationUseCase(prisma as unknown as PrismaClient)

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, 'a1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
