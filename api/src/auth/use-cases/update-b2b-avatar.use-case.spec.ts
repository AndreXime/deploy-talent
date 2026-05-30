import { BadRequestException, ForbiddenException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { StorageService } from '../../infra/storage/storage.service'
import { UpdateB2BAvatarUseCase } from './update-b2b-avatar.use-case'

describe('UpdateB2BAvatarUseCase', () => {
  it('rejects candidates', async () => {
    const useCase = new UpdateB2BAvatarUseCase({} as PrismaClient, {} as StorageService)
    await expect(
      useCase.execute('u1', null, UserRole.CANDIDATE, 'tenants/t1/users/u1/avatar/x.png'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when tenant missing', async () => {
    const useCase = new UpdateB2BAvatarUseCase({} as PrismaClient, {} as StorageService)
    await expect(
      useCase.execute('u1', null, UserRole.RECRUITER, 'tenants/t1/users/u1/avatar/x.png'),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('updates avatar key', async () => {
    const avatarKey = 'tenants/t1/users/u1/avatar/obj.png'
    const prisma = {
      user: {
        findFirst: jest.fn(async () => ({ avatarKey: null })),
        update: jest.fn(async () => ({ id: 'u1', avatarKey })),
      },
    }
    const storage = { deleteObject: jest.fn() }
    const useCase = new UpdateB2BAvatarUseCase(
      prisma as unknown as PrismaClient,
      storage as unknown as StorageService,
    )
    await useCase.execute('u1', 't1', UserRole.RECRUITER, avatarKey)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { avatarKey },
    })
  })
})
