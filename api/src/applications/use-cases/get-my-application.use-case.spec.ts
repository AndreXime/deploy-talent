import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { GetMyApplicationUseCase } from './get-my-application.use-case'

describe('GetMyApplicationUseCase', () => {
  it('rejects recruiter actor', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn() },
      application: { findFirst: jest.fn() },
    }
    const useCase = new GetMyApplicationUseCase(prisma as unknown as PrismaClient)

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, 'a1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when application not found', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => ({ id: 'c1' })) },
      application: { findFirst: jest.fn(async () => null) },
    }
    const useCase = new GetMyApplicationUseCase(prisma as unknown as PrismaClient)

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, 'a1'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
