import { NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { GetMyProfileUseCase } from './get-my-profile.use-case'

describe('GetMyProfileUseCase', () => {
  it('throws when profile missing', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => null) },
    }
    const useCase = new GetMyProfileUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('u1')).rejects.toBeInstanceOf(NotFoundException)
  })
})
