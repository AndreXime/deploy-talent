import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

@Injectable()
export class ForgetMeUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(userId: string) {
    const profile = await this.prisma.candidate.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, email: true },
    })
    if (!profile) throw new NotFoundException('Candidate profile not found')

    const anonymizedEmail = `deleted+${profile.id}@anon.invalid`
    if (anonymizedEmail === profile.email) {
      throw new ForbiddenException('Profile already anonymized')
    }

    return this.prisma.candidate.update({
      where: { id: profile.id },
      data: {
        name: 'Deleted Candidate',
        email: anonymizedEmail,
        phone: null,
        resumeUrl: null,
        anonymizedAt: new Date(),
        deletedAt: new Date(),
      },
    })
  }
}

