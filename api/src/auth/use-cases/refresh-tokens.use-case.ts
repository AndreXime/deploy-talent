import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { hashRefreshToken } from '../refresh-token-crypto'
import { assertB2bTenantAllowsLogin } from '../b2b-tenant-session'
import { LoginUseCase } from './login.use-case'

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly login: LoginUseCase,
  ) {}

  async execute(refreshToken: string) {
    const trimmed = refreshToken.trim()
    if (trimmed.length < 20) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const tokenHash = hashRefreshToken(trimmed)

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.refreshToken.findFirst({
        where: {
          tokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: { include: { tenant: true } } },
      })
      if (!row) throw new UnauthorizedException('Invalid refresh token')

      assertB2bTenantAllowsLogin(row.user, row.user.tenant)

      await tx.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      })

      return this.login.execute(row.user, tx)
    })
  }
}
