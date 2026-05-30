import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { StorageService } from '../../infra/storage/storage.service'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { ListCurrentTenantRecruitersUseCase } from './list-current-tenant-recruiters.use-case'

describe('ListCurrentTenantRecruitersUseCase', () => {
  it('lists recruiters with signed avatar urls', async () => {
    const createdAt = new Date('2026-01-01')
    const prisma = {
      user: {
        findMany: jest.fn(async () => [
          { id: 'r1', email: 'r@acme.com', avatarKey: 'key', createdAt },
        ]),
      },
    }
    const storage = {
      presignDownload: jest.fn(async () => ({ url: 'https://signed', expiresAt: new Date() })),
    }
    const useCase = new ListCurrentTenantRecruitersUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
      storage as unknown as StorageService,
    )
    const result = await useCase.execute()
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', role: UserRole.RECRUITER },
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, avatarKey: true, createdAt: true },
    })
    expect(result[0]?.avatarUrl).toBe('https://signed')
  })
})
