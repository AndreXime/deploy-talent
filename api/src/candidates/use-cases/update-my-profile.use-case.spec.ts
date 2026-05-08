import { NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UpdateMyProfileUseCase } from './update-my-profile.use-case'

describe('UpdateMyProfileUseCase', () => {
  it('throws when profile missing', async () => {
    const prisma = {
      candidate: {
        findFirst: jest.fn(async () => null),
        update: jest.fn(),
      },
    }
    const useCase = new UpdateMyProfileUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('u1', { name: 'N' })).rejects.toBeInstanceOf(NotFoundException)
  })
})
