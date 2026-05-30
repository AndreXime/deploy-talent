import { NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { GetTenantBySlugUseCase } from './get-tenant-by-slug.use-case'

describe('GetTenantBySlugUseCase', () => {
  it('throws when slug is empty', async () => {
    const prisma = { tenant: { findFirst: jest.fn() } }
    const useCase = new GetTenantBySlugUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute('   ')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws when tenant not found', async () => {
    const prisma = { tenant: { findFirst: jest.fn(async () => null) } }
    const useCase = new GetTenantBySlugUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute('acme')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns tenant by slug', async () => {
    const tenant = { id: 't1', name: 'Acme', slug: 'acme', logoKey: null, bannerKey: null }
    const prisma = { tenant: { findFirst: jest.fn(async () => tenant) } }
    const useCase = new GetTenantBySlugUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute('acme')).resolves.toEqual(tenant)
  })
})
