import { ForbiddenException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { StorageService } from '../../infra/storage/storage.service'
import { ProfileMediaUploadPurpose } from '../dto/profile-media-upload-purpose'
import { PresignProfileUploadUseCase } from './presign-profile-upload.use-case'

describe('PresignProfileUploadUseCase', () => {
  it('rejects non-candidate for resume upload', async () => {
    const useCase = new PresignProfileUploadUseCase({} as StorageService, {} as PrismaClient)
    await expect(
      useCase.execute(
        { sub: 'u1', role: UserRole.RECRUITER, tenantId: 't1' },
        {
          purpose: ProfileMediaUploadPurpose.CANDIDATE_RESUME,
          contentType: 'application/pdf',
          fileName: 'cv.pdf',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('presigns candidate avatar upload', async () => {
    const storage = {
      presignUpload: jest.fn(async () => ({ url: 'https://upload', expiresAt: new Date() })),
    }
    const useCase = new PresignProfileUploadUseCase(
      storage as unknown as StorageService,
      {} as PrismaClient,
    )
    const result = await useCase.execute(
      { sub: 'u1', role: UserRole.CANDIDATE, tenantId: null },
      {
        purpose: ProfileMediaUploadPurpose.CANDIDATE_AVATAR,
        contentType: 'image/png',
      },
    )
    expect(result.url).toBe('https://upload')
    expect(storage.presignUpload).toHaveBeenCalled()
  })
})
