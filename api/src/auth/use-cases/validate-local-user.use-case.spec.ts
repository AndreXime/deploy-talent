import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import type { PrismaClient } from '../../../generated/prisma/client'
import { ValidateLocalUserUseCase } from './validate-local-user.use-case'

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}))

describe('ValidateLocalUserUseCase', () => {
  beforeEach(() => {
    jest.mocked(bcrypt.compare).mockReset()
  })

  it('throws when user not found', async () => {
    const prisma = {
      user: { findFirst: jest.fn(async () => null) },
    }
    const useCase = new ValidateLocalUserUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('a@a.com', 'secret')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('throws when password does not match', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn(async () => ({
          id: 'u1',
          email: 'a@a.com',
          passwordHash: 'hash',
        })),
      },
    }
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never)
    const useCase = new ValidateLocalUserUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('a@a.com', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
