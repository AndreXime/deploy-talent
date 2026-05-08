import { NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { SoftDeleteTenantUseCase } from './soft-delete-tenant.use-case'

describe('SoftDeleteTenantUseCase', () => {
  it('throws when tenant not found', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => null),
        update: jest.fn(),
      },
    }
    const useCase = new SoftDeleteTenantUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns tenant unchanged when already deleted', async () => {
    const tenant = { id: 't1', deletedAt: new Date() }
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => tenant),
        update: jest.fn(),
      },
    }
    const useCase = new SoftDeleteTenantUseCase(prisma as unknown as PrismaClient)

    const result = await useCase.execute('t1')

    expect(prisma.tenant.update).not.toHaveBeenCalled()
    expect(result).toEqual(tenant)
  })
})
