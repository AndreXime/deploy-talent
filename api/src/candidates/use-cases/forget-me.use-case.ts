import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { StorageService } from '../../infra/storage/storage.service'

@Injectable()
export class ForgetMeUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly storage: StorageService,
  ) {}

  async execute(userId: string) {
    const profile = await this.prisma.candidate.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, email: true, avatarKey: true },
    })
    if (!profile) throw new NotFoundException('Candidate profile not found')

    const anonymizedEmail = `deleted+${profile.id}@anon.invalid`
    if (anonymizedEmail === profile.email) {
      throw new ForbiddenException('Profile already anonymized')
    }

    if (profile.avatarKey) {
      void this.storage.deleteObject(profile.avatarKey).catch(() => undefined)
    }

    return this.prisma.candidate.update({
      where: { id: profile.id },
      data: {
        name: 'Deleted Candidate',
        email: anonymizedEmail,
        phone: null,
        resumeUrl: null,
        avatarKey: null,
        anonymizedAt: new Date(),
        deletedAt: new Date(),
      },
    })
  }
}

