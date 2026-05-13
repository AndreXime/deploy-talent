import { Inject, Injectable } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { hashRefreshToken } from '../refresh-token-crypto'

@Injectable()
export class LogoutUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(userId: string, refreshToken?: string) {
    const trimmed = refreshToken?.trim()
    if (trimmed !== undefined && trimmed.length >= 20) {
      const tokenHash = hashRefreshToken(trimmed)
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          tokenHash,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      })
      return
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
}
