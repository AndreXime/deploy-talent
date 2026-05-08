import { NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../generated/prisma/client'
import { SuspendTenantUseCase } from './suspend-tenant.use-case'

describe('SuspendTenantUseCase', () => {
  it('suspend throws when tenant not found', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => null),
      },
    }
    const useCase = new SuspendTenantUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(NotFoundException)
  })
})