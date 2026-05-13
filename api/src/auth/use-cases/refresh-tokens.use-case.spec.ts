import { UnauthorizedException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { LoginUseCase } from './login.use-case'
import { RefreshTokensUseCase } from './refresh-tokens.use-case'

describe('RefreshTokensUseCase', () => {
  const user = {
    id: 'u1',
    email: 'a@a.com',
    tenantId: null,
    role: UserRole.CANDIDATE,
    passwordHash: 'h',
  }

  it('rejeita refresh curto demais', async () => {
    const uc = new RefreshTokensUseCase(
      { $transaction: jest.fn() } as unknown as PrismaClient,
      {} as unknown as LoginUseCase,
    )
    await expect(uc.execute('short')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('recusa token desconhecido', async () => {
    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          refreshToken: {
            findFirst: jest.fn(async () => null),
          },
        }
        return fn(tx)
      }),
    } as unknown as PrismaClient
    const uc = new RefreshTokensUseCase(prisma, {} as unknown as LoginUseCase)
    await expect(uc.execute('a'.repeat(40))).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('revoga o refresh usado e emite novo par', async () => {
    const row = {
      id: 'rt1',
      userId: 'u1',
      user,
    }
    const findFirst = jest.fn(async () => row)
    const update = jest.fn(async () => ({}))
    const loginExecute = jest.fn(async () => ({
      access_token: 'new-access',
      refresh_token: 'new-refresh-raw',
    }))

    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          refreshToken: {
            findFirst,
            update,
          },
        }
        return fn(tx)
      }),
    } as unknown as PrismaClient

    const uc = new RefreshTokensUseCase(prisma, {
      execute: loginExecute,
    } as unknown as LoginUseCase)

    const result = await uc.execute('a'.repeat(43))

    expect(result).toEqual({ access_token: 'new-access', refresh_token: 'new-refresh-raw' })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'rt1' },
      data: { revokedAt: expect.any(Date) },
    })
    expect(loginExecute).toHaveBeenCalledWith(user, expect.anything())
  })
})
