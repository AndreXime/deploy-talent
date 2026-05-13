import type { PrismaClient } from '../../generated/prisma/client'
import { EnvService } from '../infra/env/env.service'
import { RefreshTokensCleanupTask } from './refresh-tokens-cleanup.task'

describe('RefreshTokensCleanupTask', () => {
  it('não corre em TEST', async () => {
    const deleteMany = jest.fn()
    const prisma = { refreshToken: { deleteMany } } as unknown as PrismaClient
    const task = new RefreshTokensCleanupTask(prisma, { envMode: 'TEST' } as unknown as EnvService)
    await task.removeExpiredRefreshTokens()
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('apaga linhas com expiresAt no passado', async () => {
    const deleteMany = jest.fn(async () => ({ count: 2 }))
    const prisma = { refreshToken: { deleteMany } } as unknown as PrismaClient
    const task = new RefreshTokensCleanupTask(prisma, { envMode: 'DEV' } as unknown as EnvService)
    await task.removeExpiredRefreshTokens()
    expect(deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    })
  })
})
