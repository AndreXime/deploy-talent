import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { ListMyApplicationsUseCase } from './list-my-applications.use-case'

describe('ListMyApplicationsUseCase', () => {
  it('rejects recruiter actor', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn() },
      application: { findMany: jest.fn(), count: jest.fn() },
    }
    const useCase = new ListMyApplicationsUseCase(prisma as unknown as PrismaClient)

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when candidate profile missing', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => null) },
      application: { findMany: jest.fn(), count: jest.fn() },
    }
    const useCase = new ListMyApplicationsUseCase(prisma as unknown as PrismaClient)

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, {}),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
