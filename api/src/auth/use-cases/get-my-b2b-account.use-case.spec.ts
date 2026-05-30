import { ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { StorageService } from '../../infra/storage/storage.service'
import { GetMyB2BAccountUseCase } from './get-my-b2b-account.use-case'

describe('GetMyB2BAccountUseCase', () => {
  it('rejects candidates', async () => {
    const useCase = new GetMyB2BAccountUseCase({} as PrismaClient, {} as StorageService)
    await expect(useCase.execute('u1', UserRole.CANDIDATE)).rejects.toBeInstanceOf(
      ForbiddenException,
    )
  })

  it('throws when user not found', async () => {
    const prisma = { user: { findFirst: jest.fn(async () => null) } }
    const useCase = new GetMyB2BAccountUseCase(
      prisma as unknown as PrismaClient,
      {} as StorageService,
    )
    await expect(useCase.execute('u1', UserRole.TENANT_ADMIN)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('returns b2b account with avatar url', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn(async () => ({
          id: 'u1',
          email: 'a@acme.com',
          tenantId: 't1',
          role: UserRole.RECRUITER,
          avatarKey: 'key',
        })),
      },
    }
    const storage = {
      presignDownload: jest.fn(async () => ({ url: 'https://avatar', expiresAt: new Date() })),
    }
    const useCase = new GetMyB2BAccountUseCase(
      prisma as unknown as PrismaClient,
      storage as unknown as StorageService,
    )
    const result = await useCase.execute('u1', UserRole.RECRUITER)
    expect(result.avatarUrl).toBe('https://avatar')
  })
})
