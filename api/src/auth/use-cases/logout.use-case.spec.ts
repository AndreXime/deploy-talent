import type { PrismaClient } from '../../../generated/prisma/client'
import { LogoutUseCase } from './logout.use-case'

describe('LogoutUseCase', () => {
  it('revoga só o refresh indicado quando há token', async () => {
    const updateMany = jest.fn(async () => ({ count: 1 }))
    const prisma = { refreshToken: { updateMany } } as unknown as PrismaClient
    const uc = new LogoutUseCase(prisma)
    await uc.execute('user-1', 'a'.repeat(43))
    expect(updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.any(String),
        revokedAt: null,
      }),
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('revoga todos os refresh ativos quando o corpo não traz refresh', async () => {
    const updateMany = jest.fn(async () => ({ count: 3 }))
    const prisma = { refreshToken: { updateMany } } as unknown as PrismaClient
    const uc = new LogoutUseCase(prisma)
    await uc.execute('user-1')
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
  })
})
