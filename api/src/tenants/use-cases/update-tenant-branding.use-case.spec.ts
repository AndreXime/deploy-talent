import { BadRequestException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { StorageService } from '../../infra/storage/storage.service'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { UpdateTenantBrandingUseCase } from './update-tenant-branding.use-case'

describe('UpdateTenantBrandingUseCase', () => {
  const actor = { userId: 'u1', role: UserRole.TENANT_ADMIN, tenantId: 't1' }

  it('throws when no keys provided', async () => {
    const useCase = new UpdateTenantBrandingUseCase(
      {} as PrismaClient,
      { getTenantId: () => 't1' } as TenantContextService,
      {} as StorageService,
    )
    await expect(useCase.execute(actor, {})).rejects.toBeInstanceOf(BadRequestException)
  })

  it('updates logo key for tenant admin', async () => {
    const logoKey = 'tenants/t1/logo/obj.png'
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => ({ logoKey: null, bannerKey: null })),
        update: jest.fn(async () => ({ id: 't1', logoKey })),
      },
    }
    const storage = { deleteObject: jest.fn() }
    const useCase = new UpdateTenantBrandingUseCase(
      prisma as unknown as PrismaClient,
      { getTenantId: () => 't1' } as TenantContextService,
      storage as unknown as StorageService,
    )
    await useCase.execute(actor, { logoKey })
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { logoKey },
    })
  })
})
