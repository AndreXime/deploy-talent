import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from './prisma.constants'

/**
 * Atrasos entre tentativas no arranque. Total ~7.75s antes de desistir, suficiente
 * para absorver blips transitórios do Postgres sem prender o orquestrador.
 */
const RETRY_DELAYS_MS = [250, 500, 1000, 2000, 4000] as const

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Gere o ciclo de vida da ligação ao Postgres: garante que está acessível antes
 * de o Nest começar a aceitar pedidos (com retry) e fecha-a no encerramento.
 * Se o arranque falhar todas as tentativas, lança e o processo termina com
 * código 1 (ver `bootstrap()` em `main.ts`).
 */
@Injectable()
export class PrismaConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaConnectionService.name)

  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async onModuleInit(): Promise<void> {
    const totalAttempts = RETRY_DELAYS_MS.length + 1
    let lastError: unknown

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      try {
        await this.prisma.$queryRaw`SELECT 1`
        if (attempt > 1) {
          this.logger.log(`Postgres acessível (tentativa ${attempt}/${totalAttempts})`)
        } else {
          this.logger.log('Postgres acessível')
        }
        return
      } catch (err: unknown) {
        lastError = err
        const nextDelay = RETRY_DELAYS_MS[attempt - 1]
        if (nextDelay === undefined) break
        const reason = err instanceof Error ? err.message : String(err)
        this.logger.warn(
          `Postgres indisponível (${reason}); nova tentativa em ${nextDelay}ms (${attempt}/${totalAttempts})`,
        )
        await sleep(nextDelay)
      }
    }

    const reason = lastError instanceof Error ? lastError.message : String(lastError)
    throw new Error(
      `Não foi possível ligar à base de dados após ${totalAttempts} tentativas: ${reason}`,
    )
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect()
  }
}
