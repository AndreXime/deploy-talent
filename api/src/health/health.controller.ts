import { Controller, Get, Inject } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import type { PrismaClient } from '../../generated/prisma/client'
import { Public } from '../auth/public.decorator'
import { PRISMA_CLIENT } from '../infra/prisma/prisma.constants'

@Public()
@SkipThrottle()
@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness (sem dependências externas)' })
  @ApiOkResponse({ description: 'Processo ativo' })
  live(): { status: 'live' } {
    return { status: 'live' }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness (checagem do banco)' })
  @ApiOkResponse({ description: 'PostgreSQL acessível' })
  async ready(): Promise<{ status: 'ready' }> {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ready' }
  }
}
