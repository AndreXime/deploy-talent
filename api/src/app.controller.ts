import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppRootResponseDto } from './app-root-response.dto'
import { Public } from './auth/public.decorator'

@Controller()
@ApiTags('Raiz')
export class AppController {
  private readonly apiVersion: string

  constructor() {
    const packageJsonPath = join(process.cwd(), 'package.json')
    const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string }
    const v = parsed.version?.trim()
    this.apiVersion = v && v.length > 0 ? v : '0.0.0'
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Informações da API' })
  @ApiOkResponse({
    description: 'Identificação, versão e estado básicos do serviço',
    type: AppRootResponseDto,
  })
  getRoot(): AppRootResponseDto {
    return {
      name: 'Deploy Talent API',
      version: this.apiVersion,
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    }
  }
}
