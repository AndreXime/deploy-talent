import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { UserRole } from '../../../generated/prisma/client'
import type { JwtPayload } from '../../auth/jwt-payload'
import { StorageService } from '../../infra/storage/storage.service'
import type { PresignProfileUploadDto } from '../dto/presign-profile-upload.dto'
import { ProfileMediaUploadPurpose } from '../dto/profile-media-upload-purpose'
import {
  assertProfileImageContentType,
  buildCandidateAvatarKey,
  buildTenantBannerKey,
  buildTenantLogoKey,
  buildTenantUserAvatarKey,
  fileExtensionForContentType,
} from '../media-key.util'

@Injectable()
export class PresignProfileUploadUseCase {
  constructor(private readonly storage: StorageService) {}

  async execute(user: JwtPayload, input: PresignProfileUploadDto) {
    assertProfileImageContentType(input.contentType)
    const ext = fileExtensionForContentType(input.contentType)
    const objectId = randomUUID()

    const role = user.role as UserRole

    switch (input.purpose) {
      case ProfileMediaUploadPurpose.CANDIDATE_AVATAR: {
        if (role !== UserRole.CANDIDATE) {
          throw new ForbiddenException('Only candidates can request this upload')
        }
        const key = buildCandidateAvatarKey(user.sub, objectId, ext)
        return this.storage.presignUpload({ key, contentType: input.contentType })
      }
      case ProfileMediaUploadPurpose.B2B_USER_AVATAR: {
        if (role !== UserRole.TENANT_ADMIN && role !== UserRole.RECRUITER) {
          throw new ForbiddenException('Only tenant users can request this upload')
        }
        const tenantId = user.tenantId
        if (!tenantId) throw new BadRequestException('Missing tenant for B2B user')
        const key = buildTenantUserAvatarKey(tenantId, user.sub, objectId, ext)
        return this.storage.presignUpload({ key, contentType: input.contentType })
      }
      case ProfileMediaUploadPurpose.TENANT_LOGO:
      case ProfileMediaUploadPurpose.TENANT_BANNER: {
        if (role !== UserRole.TENANT_ADMIN && role !== UserRole.RECRUITER) {
          throw new ForbiddenException('Only tenant users can update company media')
        }
        const tenantId = user.tenantId
        if (!tenantId) throw new BadRequestException('Missing tenant for company media')
        const key =
          input.purpose === ProfileMediaUploadPurpose.TENANT_LOGO
            ? buildTenantLogoKey(tenantId, objectId, ext)
            : buildTenantBannerKey(tenantId, objectId, ext)
        return this.storage.presignUpload({ key, contentType: input.contentType })
      }
    }
    throw new BadRequestException('Invalid upload purpose')
  }
}
