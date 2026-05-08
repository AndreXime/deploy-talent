import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type EnvMode = 'DEV' | 'TEST' | 'PROD'

@Injectable()
export class EnvService {
  constructor(private readonly config: ConfigService) {}

  get envMode(): EnvMode {
    const value = this.config.get<string>('ENV_MODE', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing ENV_MODE')
    }

    if (value !== 'DEV' && value !== 'TEST' && value !== 'PROD') {
      throw new Error(`Invalid ENV_MODE: "${value}" (expected DEV | TEST | PROD)`)
    }

    return value
  }

  get port(): number {
    const value = this.config.get<string>('PORT', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing PORT')
    }
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
      throw new Error(`Invalid PORT: "${value}"`)
    }
    return parsed
  }

  get databaseUrl(): string {
    const value = this.config.get<string>('DATABASE_URL', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing DATABASE_URL')
    }
    return value
  }

  get jwtSecret(): string {
    const value = this.config.get<string>('JWT_SECRET', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing JWT_SECRET')
    }
    return value
  }

  get jwtExpiresIn(): string {
    const value = this.config.get<string>('JWT_EXPIRES_IN', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing JWT_EXPIRES_IN')
    }
    return value
  }
}

