import { NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { StorageService } from '../../infra/storage/storage.service'
import { GetPublicTenantBrandingUseCase } from './get-public-tenant-branding.use-case'

describe('GetPublicTenantBrandingUseCase', () => {
  it('throws when tenant not found', async () => {
    const prisma = { tenant: { findFirst: jest.fn(async () => null) } }
    const useCase = new GetPublicTenantBrandingUseCase(
      prisma as unknown as PrismaClient,
      {} as StorageService,
    )
    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns branding with presigned urls', async () => {
    const expiresAt = new Date('2026-06-01')
    const prisma = {
      tenant: {
        findFirst: jest.fn(async () => ({
          name: 'Acme',
          logoKey: 'logo-key',
          bannerKey: null,
        })),
      },
    }
    const storage = {
      presignDownload: jest.fn(async () => ({ url: 'https://logo', expiresAt })),
    }
    const useCase = new GetPublicTenantBrandingUseCase(
      prisma as unknown as PrismaClient,
      storage as unknown as StorageService,
    )
    const result = await useCase.execute('t1')
    expect(result.name).toBe('Acme')
    expect(result.logo?.url).toBe('https://logo')
    expect(result.banner).toBeNull()
  })
})
