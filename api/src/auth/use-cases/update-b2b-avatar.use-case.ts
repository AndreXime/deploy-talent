import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { StorageService } from '../../infra/storage/storage.service'
import { assertKeyMatchesB2bUserAvatar } from '../../media/media-key.util'

@Injectable()
export class UpdateB2BAvatarUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly storage: StorageService,
  ) {}

  async execute(userId: string, tenantId: string | null, role: UserRole, rawAvatarKey: string) {
    if (role !== UserRole.TENANT_ADMIN && role !== UserRole.RECRUITER) {
      throw new ForbiddenException('Only tenant users can set avatar')
    }
    if (!tenantId) throw new BadRequestException('Missing tenant for B2B user')

    const avatarKey = rawAvatarKey.trim() === '' ? null : rawAvatarKey.trim()
    if (avatarKey !== null) {
      assertKeyMatchesB2bUserAvatar(avatarKey, tenantId, userId)
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { avatarKey: true },
    })
    if (!user) throw new NotFoundException('User not found')

    if (user.avatarKey && user.avatarKey !== avatarKey) {
      void this.storage.deleteObject(user.avatarKey).catch(() => undefined)
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarKey },
    })
  }
}
