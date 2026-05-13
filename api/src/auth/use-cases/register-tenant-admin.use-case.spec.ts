import { ConflictException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { RegisterTenantAdminUseCase } from './register-tenant-admin.use-case'

describe('RegisterTenantAdminUseCase', () => {
  it('throws when email exists', async () => {
    const prisma = {
      user: { findFirst: jest.fn(async () => ({ id: 'u1' })) },
      $transaction: jest.fn(),
    }
    const uc = new RegisterTenantAdminUseCase(prisma as unknown as PrismaClient)
    await expect(
      uc.execute({
        companyName: 'Acme',
        email: 'a@a.com',
        password: 'password12',
      }),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
