import { BadRequestException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { LoginUseCase } from './login.use-case'
import { RegisterCandidateUseCase } from './register-candidate.use-case'

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed'),
}))

describe('RegisterCandidateUseCase', () => {
  it('throws when email already registered', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn(async () => ({ id: 'u0' })),
      },
      candidate: { create: jest.fn() },
    }
    const login = { execute: jest.fn() }
    const useCase = new RegisterCandidateUseCase(
      prisma as unknown as PrismaClient,
      login as unknown as LoginUseCase,
    )

    await expect(
      useCase.execute({ email: 'a@a.com', password: 'p', name: 'A' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
