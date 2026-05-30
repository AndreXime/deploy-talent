import { NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { GetCurrentTenantUseCase } from './get-current-tenant.use-case'

describe('GetCurrentTenantUseCase', () => {
  it('throws when tenant not found', async () => {
    const prisma = { tenant: { findFirst: jest.fn(async () => null) } }
    const tenantContext = { requireTenantId: () => 't1' } as TenantContextService
    const useCase = new GetCurrentTenantUseCase(prisma as unknown as PrismaClient, tenantContext)
    await expect(useCase.execute()).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns active tenant', async () => {
    const tenant = { id: 't1', name: 'Acme', slug: 'acme', isActive: true }
    const prisma = { tenant: { findFirst: jest.fn(async () => tenant) } }
    const tenantContext = { requireTenantId: () => 't1' } as TenantContextService
    const useCase = new GetCurrentTenantUseCase(prisma as unknown as PrismaClient, tenantContext)
    await expect(useCase.execute()).resolves.toEqual(tenant)
  })
})
