import { BadRequestException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { ApproveTenantSignupUseCase } from './approve-tenant-signup.use-case'

describe('ApproveTenantSignupUseCase', () => {
  it('throws when tenant not found', async () => {
    const prisma = { tenant: { findFirst: jest.fn(async () => null), update: jest.fn() } }
    const useCase = new ApproveTenantSignupUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws when tenant is not awaiting approval', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => ({ id: 't1', deletedAt: null, signupPending: false })),
        update: jest.fn(),
      },
    }
    const useCase = new ApproveTenantSignupUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('approves pending signup', async () => {
    const updated = { id: 't1', signupPending: false, isActive: true }
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => ({ id: 't1', deletedAt: null, signupPending: true })),
        update: jest.fn(async () => updated),
      },
    }
    const useCase = new ApproveTenantSignupUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute('t1')).resolves.toEqual(updated)
  })
})
