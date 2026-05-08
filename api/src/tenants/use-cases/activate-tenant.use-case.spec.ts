import { BadRequestException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { ActivateTenantUseCase } from './activate-tenant.use-case'

describe('ActivateTenantUseCase', () => {
  it('throws when tenant does not exist', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => null),
        update: jest.fn(),
      },
    }
    const useCase = new ActivateTenantUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws when tenant is soft-deleted', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => ({
          id: 't1',
          deletedAt: new Date(),
          isActive: false,
        })),
        update: jest.fn(),
      },
    }
    const useCase = new ActivateTenantUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(BadRequestException)
  })
})
