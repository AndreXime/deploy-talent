import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import type { PrismaClient } from '../../generated/prisma/client'
import { EnvService } from '../infra/env/env.service'
import { PRISMA_CLIENT } from '../infra/prisma/prisma.constants'

/**
 * Remove `refresh_tokens` com `expiresAt` no passado (a cada 6 horas, UTC).
 * Revogados mas ainda dentro do TTL permanecem até expirarem.
 */
@Injectable()
export class RefreshTokensCleanupTask {
  private readonly logger = new Logger(RefreshTokensCleanupTask.name)

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly env: EnvService,
  ) {}

  @Cron('0 */6 * * *', { timeZone: 'UTC' })
  async removeExpiredRefreshTokens(): Promise<void> {
    if (this.env.envMode === 'TEST') return

    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    if (result.count > 0) {
      this.logger.log(`refresh_tokens expirados removidos: ${result.count}`)
    }
  }
}
