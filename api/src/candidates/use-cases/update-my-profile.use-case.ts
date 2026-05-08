import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import type { UpdateCandidateProfileDto } from '../dto/update-candidate-profile.dto'

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(userId: string, input: UpdateCandidateProfileDto) {
    const profile = await this.prisma.candidate.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    })
    if (!profile) throw new NotFoundException('Candidate profile not found')

    return this.prisma.candidate.update({
      where: { id: profile.id },
      data: {
        name: input.name,
        phone: input.phone,
        resumeUrl: input.resumeUrl,
      },
    })
  }
}

