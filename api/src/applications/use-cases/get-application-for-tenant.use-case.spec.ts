import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { GetApplicationForTenantUseCase } from './get-application-for-tenant.use-case'

describe('GetApplicationForTenantUseCase', () => {
  it('rejects candidate actor', async () => {
    const prisma = { application: { findFirst: jest.fn() } }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new GetApplicationForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, 'a1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when tenant context missing', async () => {
    const prisma = { application: { findFirst: jest.fn() } }
    const tenantContext = { getTenantId: () => null as string | null }
    const useCase = new GetApplicationForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, 'a1'),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('throws when application not found', async () => {
    const prisma = { application: { findFirst: jest.fn(async () => null) } }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new GetApplicationForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, 'a1'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
