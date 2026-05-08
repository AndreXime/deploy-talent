import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import type { JwtPayload } from '../../auth/jwt-payload'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { StorageService } from '../../infra/storage/storage.service'
import {
  parseCandidateAvatarKey,
  parseTenantBannerKey,
  parseTenantLogoKey,
  parseTenantUserAvatarKey,
} from '../media-key.util'

@Injectable()
export class PresignAssetDownloadUseCase {
  constructor(
    private readonly storage: StorageService,
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async execute(user: JwtPayload, key: string) {
    const role = user.role as UserRole
    const tenantIdJwt = user.tenantId

    const tenantLogo = parseTenantLogoKey(key)
    if (tenantLogo !== null) {
      if (role !== UserRole.TENANT_ADMIN && role !== UserRole.RECRUITER) {
        throw new ForbiddenException('Not allowed to download this asset')
      }
      if (tenantIdJwt !== tenantLogo) {
        throw new ForbiddenException('Not allowed to download this asset')
      }
      return this.storage.presignDownload({ key })
    }

    const tenantBanner = parseTenantBannerKey(key)
    if (tenantBanner !== null) {
      if (role !== UserRole.TENANT_ADMIN && role !== UserRole.RECRUITER) {
        throw new ForbiddenException('Not allowed to download this asset')
      }
      if (tenantIdJwt !== tenantBanner) {
        throw new ForbiddenException('Not allowed to download this asset')
      }
      return this.storage.presignDownload({ key })
    }

    const b2bAvatar = parseTenantUserAvatarKey(key)
    if (b2bAvatar !== null) {
      if (role !== UserRole.TENANT_ADMIN && role !== UserRole.RECRUITER) {
        throw new ForbiddenException('Not allowed to download this asset')
      }
      if (tenantIdJwt !== b2bAvatar.tenantId) {
        throw new ForbiddenException('Not allowed to download this asset')
      }
      return this.storage.presignDownload({ key })
    }

    const candidateUserId = parseCandidateAvatarKey(key)
    if (candidateUserId !== null) {
      if (role === UserRole.CANDIDATE && user.sub === candidateUserId) {
        return this.storage.presignDownload({ key })
      }
      if (role === UserRole.TENANT_ADMIN || role === UserRole.RECRUITER) {
        if (!tenantIdJwt) throw new BadRequestException('Missing tenant context')
        const link = await this.prisma.application.findFirst({
          where: {
            tenantId: tenantIdJwt,
            candidate: { userId: candidateUserId, deletedAt: null },
          },
          select: { id: true },
        })
        if (!link) {
          throw new ForbiddenException('Not allowed to download this asset')
        }
        return this.storage.presignDownload({ key })
      }
      throw new ForbiddenException('Not allowed to download this asset')
    }

    throw new BadRequestException('Unrecognized storage key pattern')
  }
}
