import { BadRequestException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { RejectTenantSignupUseCase } from './reject-tenant-signup.use-case'

describe('RejectTenantSignupUseCase', () => {
  it('throws when tenant not found', async () => {
    const prisma = { tenant: { findFirst: jest.fn(async () => null) }, $transaction: jest.fn() }
    const useCase = new RejectTenantSignupUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws when tenant is not pending signup', async () => {
    const prisma = {
      tenant: { findFirst: jest.fn(async () => ({ id: 't1', signupPending: false })) },
      $transaction: jest.fn(),
    }
    const useCase = new RejectTenantSignupUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('deletes tenant and users on reject', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => ({ id: 't1', signupPending: true })),
        delete: jest.fn(),
      },
      user: { deleteMany: jest.fn() },
      $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    }
    const useCase = new RejectTenantSignupUseCase(prisma as unknown as PrismaClient)
    await useCase.execute('t1')
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
