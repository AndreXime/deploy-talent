import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { StorageService } from '../../infra/storage/storage.service'
import {
  assertKeyMatchesCandidateAvatar,
  assertKeyMatchesCandidateResume,
} from '../../media/media-key.util'
import type { UpdateCandidateProfileDto } from '../dto/update-candidate-profile.dto'

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly storage: StorageService,
  ) {}

  async execute(userId: string, input: UpdateCandidateProfileDto) {
    const profile = await this.prisma.candidate.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, avatarKey: true, resumeKey: true },
    })
    if (!profile) throw new NotFoundException('Candidate profile not found')

    if (input.avatarKey !== undefined) {
      const next = input.avatarKey.trim() === '' ? null : input.avatarKey.trim()
      if (next !== null) assertKeyMatchesCandidateAvatar(next, userId)
      if (profile.avatarKey && profile.avatarKey !== next) {
        void this.storage.deleteObject(profile.avatarKey).catch(() => undefined)
      }
    }

    if (input.resumeKey !== undefined) {
      const next = input.resumeKey.trim() === '' ? null : input.resumeKey.trim()
      if (next !== null) assertKeyMatchesCandidateResume(next, userId)
      if (profile.resumeKey && profile.resumeKey !== next) {
        void this.storage.deleteObject(profile.resumeKey).catch(() => undefined)
      }
    }

    const data: {
      name?: string
      phone?: string
      resumeKey?: string | null
      avatarKey?: string | null
    } = {}
    if (input.name !== undefined) data.name = input.name
    if (input.phone !== undefined) data.phone = input.phone
    if (input.resumeKey !== undefined) {
      data.resumeKey = input.resumeKey.trim() === '' ? null : input.resumeKey.trim()
    }
    if (input.avatarKey !== undefined) {
      data.avatarKey = input.avatarKey.trim() === '' ? null : input.avatarKey.trim()
    }

    return this.prisma.candidate.update({
      where: { id: profile.id },
      data,
    })
  }
}

