import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { RemoveTenantRecruiterUseCase } from './remove-tenant-recruiter.use-case'

function buildContext(tenantId: string): TenantContextService {
  return { requireTenantId: () => tenantId } as unknown as TenantContextService
}

describe('RemoveTenantRecruiterUseCase', () => {
  it('refuses self removal', async () => {
    const prisma = { user: { findFirst: jest.fn(), delete: jest.fn() } }
    const useCase = new RemoveTenantRecruiterUseCase(
      prisma as unknown as PrismaClient,
      buildContext('t1'),
    )

    await expect(useCase.execute('u1', 'u1')).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.user.findFirst).not.toHaveBeenCalled()
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it('throws NotFound when recruiter does not exist', async () => {
    const prisma = {
      user: { findFirst: jest.fn(async () => null), delete: jest.fn() },
    }
    const useCase = new RemoveTenantRecruiterUseCase(
      prisma as unknown as PrismaClient,
      buildContext('t1'),
    )

    await expect(useCase.execute('admin', 'missing')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('refuses to remove a user from a different tenant', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn(async () => ({ id: 'u2', role: 'RECRUITER', tenantId: 'other' })),
        delete: jest.fn(),
      },
    }
    const useCase = new RemoveTenantRecruiterUseCase(
      prisma as unknown as PrismaClient,
      buildContext('t1'),
    )

    await expect(useCase.execute('admin', 'u2')).rejects.toBeInstanceOf(ForbiddenException)
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it('refuses to remove a non recruiter (e.g. tenant admin)', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn(async () => ({ id: 'u2', role: 'TENANT_ADMIN', tenantId: 't1' })),
        delete: jest.fn(),
      },
    }
    const useCase = new RemoveTenantRecruiterUseCase(
      prisma as unknown as PrismaClient,
      buildContext('t1'),
    )

    await expect(useCase.execute('admin', 'u2')).rejects.toBeInstanceOf(ForbiddenException)
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it('hard deletes the recruiter when same tenant', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn(async () => ({ id: 'u2', role: 'RECRUITER', tenantId: 't1' })),
        delete: jest.fn(async () => ({ id: 'u2' })),
      },
    }
    const useCase = new RemoveTenantRecruiterUseCase(
      prisma as unknown as PrismaClient,
      buildContext('t1'),
    )

    await useCase.execute('admin', 'u2')

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } })
  })
})
