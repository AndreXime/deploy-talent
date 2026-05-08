import { ForbiddenException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { ListApplicationsForTenantUseCase } from './list-applications-for-tenant.use-case'

describe('ListApplicationsForTenantUseCase', () => {
  it('rejects candidate actor', async () => {
    const prisma = {
      application: { findMany: jest.fn(), count: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ListApplicationsForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('returns paginated applications', async () => {
    const items = [{ id: 'a1' }]
    const prisma = {
      application: {
        findMany: jest.fn(async () => items),
        count: jest.fn(async () => 1),
      },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ListApplicationsForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    const result = await useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, { page: 1 })

    expect(result).toEqual({ items, total: 1, page: 1, limit: 20 })
  })
})
