import { randomUUID } from 'node:crypto'
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { JwtPayload } from '../../auth/jwt-payload'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { buildStorageKey, sanitizeFileName } from '../../infra/storage/storage.constants'
import { StorageService } from '../../infra/storage/storage.service'
import { assertPipelineStageFileContentType } from '../../pipelines/stage-config'
import type { PresignProfileUploadDto } from '../dto/presign-profile-upload.dto'
import { ProfileMediaUploadPurpose } from '../dto/profile-media-upload-purpose'
import {
  assertProfileImageContentType,
  assertResumeDocumentContentType,
  buildCandidateAvatarKey,
  buildTenantBannerKey,
  buildTenantLogoKey,
  buildTenantUserAvatarKey,
  fileExtensionForContentType,
  fileExtensionForResumeContentType,
} from '../media-key.util'

function resumeObjectFileName(original: string, ext: string): string {
  const base = sanitizeFileName(original).replace(/\.[a-z0-9]+$/i, '')
  const stem = base.length > 0 ? base : 'curriculum'
  return `${stem}.${ext}`
}

function attachmentObjectFileName(original: string): string {
  const sanitized = sanitizeFileName(original)
  return sanitized.length > 0 ? sanitized : 'attachment'
}

@Injectable()
export class PresignProfileUploadUseCase {
  constructor(
    private readonly storage: StorageService,
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async execute(user: JwtPayload, input: PresignProfileUploadDto) {
    const objectId = randomUUID()
    const role = user.role as UserRole

    switch (input.purpose) {
      case ProfileMediaUploadPurpose.CANDIDATE_RESUME: {
        if (role !== UserRole.CANDIDATE) {
          throw new ForbiddenException('Only candidates can request this upload')
        }
        const rawName = input.fileName?.trim()
        if (!rawName) throw new BadRequestException('fileName is required for resume upload')
        assertResumeDocumentContentType(input.contentType)
        const ext = fileExtensionForResumeContentType(input.contentType)
        const key = buildStorageKey({
          scope: 'CANDIDATE',
          ownerId: user.sub,
          namespace: 'resumes',
          fileName: resumeObjectFileName(rawName, ext),
          uniqueId: objectId,
        })
        return this.storage.presignUpload({ key, contentType: input.contentType })
      }
      case ProfileMediaUploadPurpose.APPLICATION_STAGE_FILE: {
        if (role !== UserRole.CANDIDATE) {
          throw new ForbiddenException('Only candidates can upload stage files')
        }
        const applicationId = input.applicationId
        if (!applicationId) {
          throw new BadRequestException('applicationId is required for stage file upload')
        }
        const rawName = input.fileName?.trim()
        if (!rawName) throw new BadRequestException('fileName is required for stage file upload')
        const candidate = await this.prisma.candidate.findFirst({
          where: { userId: user.sub, deletedAt: null },
          select: { id: true },
        })
        if (!candidate) throw new ForbiddenException('Candidate profile not found')
        const owns = await this.prisma.application.findFirst({
          where: { id: applicationId, candidateId: candidate.id },
          select: { id: true },
        })
        if (!owns) throw new ForbiddenException('Application does not belong to candidate')
        assertPipelineStageFileContentType(input.contentType)
        const key = buildStorageKey({
          scope: 'CANDIDATE',
          ownerId: user.sub,
          namespace: 'attachments',
          fileName: attachmentObjectFileName(rawName),
          uniqueId: objectId,
        })
        return this.storage.presignUpload({ key, contentType: input.contentType })
      }
      case ProfileMediaUploadPurpose.CANDIDATE_AVATAR: {
        assertProfileImageContentType(input.contentType)
        const ext = fileExtensionForContentType(input.contentType)
        if (role !== UserRole.CANDIDATE) {
          throw new ForbiddenException('Only candidates can request this upload')
        }
        const key = buildCandidateAvatarKey(user.sub, objectId, ext)
        return this.storage.presignUpload({ key, contentType: input.contentType })
      }
      case ProfileMediaUploadPurpose.B2B_USER_AVATAR: {
        assertProfileImageContentType(input.contentType)
        const ext = fileExtensionForContentType(input.contentType)
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
        assertProfileImageContentType(input.contentType)
        const ext = fileExtensionForContentType(input.contentType)
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
