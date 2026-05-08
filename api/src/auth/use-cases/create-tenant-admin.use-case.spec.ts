import { BadRequestException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { CreateTenantAdminUseCase } from './create-tenant-admin.use-case'

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed'),
}))

describe('CreateTenantAdminUseCase', () => {
  it('throws when tenant invalid', async () => {
    const prisma = {
      tenant: { findFirst: jest.fn(async () => null) },
      user: { findFirst: jest.fn(), create: jest.fn() },
    }
    const useCase = new CreateTenantAdminUseCase(prisma as unknown as PrismaClient)

    await expect(
      useCase.execute({ tenantId: 't1', email: 'a@a.com', password: 'p' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('throws when email already in use', async () => {
    const prisma = {
      tenant: { findFirst: jest.fn(async () => ({ id: 't1' })) },
      user: { findFirst: jest.fn(async () => ({ id: 'u0' })), create: jest.fn() },
    }
    const useCase = new CreateTenantAdminUseCase(prisma as unknown as PrismaClient)

    await expect(
      useCase.execute({ tenantId: 't1', email: 'a@a.com', password: 'p' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
