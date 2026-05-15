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

  /**
   * Access JWT TTL (Authorization Bearer). Prefer `JWT_ACCESS_EXPIRES_IN`;
   * `JWT_EXPIRES_IN` mantém compatibilidade com deploys antigos.
   */
  get jwtAccessExpiresIn(): string {
    const primary = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', { infer: true })
    if (primary && primary.trim().length > 0) return primary.trim()
    const legacy = this.config.get<string>('JWT_EXPIRES_IN', { infer: true })
    if (legacy && legacy.trim().length > 0) return legacy.trim()
    return '10m'
  }

  /** TTL do refresh opaco persistido em `refresh_tokens` (ex.: `24h`; padrão `24h`). */
  get jwtRefreshExpiresIn(): string {
    const value = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', { infer: true })
    if (!value || value.trim().length === 0) return '24h'
    return value.trim()
  }

  get awsRegion(): string {
    const value = this.config.get<string>('AWS_REGION', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing AWS_REGION')
    }
    return value
  }

  get s3Bucket(): string {
    const value = this.config.get<string>('S3_BUCKET', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing S3_BUCKET')
    }
    return value
  }

  get s3Endpoint(): string | null {
    const value = this.config.get<string>('S3_ENDPOINT', { infer: true })
    if (!value || value.trim().length === 0) return null
    return value
  }

  get s3ForcePathStyle(): boolean {
    const value = this.config.get<string>('S3_FORCE_PATH_STYLE', { infer: true })
    return value === 'true' || value === '1'
  }

  get s3AccessKeyId(): string | null {
    const value = this.config.get<string>('S3_ACCESS_KEY_ID', { infer: true })
    if (!value || value.trim().length === 0) return null
    return value
  }

  get s3SecretAccessKey(): string | null {
    const value = this.config.get<string>('S3_SECRET_ACCESS_KEY', { infer: true })
    if (!value || value.trim().length === 0) return null
    return value
  }

  get s3PresignTtlSeconds(): number {
    const value = this.config.get<string>('S3_PRESIGN_TTL_SECONDS', { infer: true })
    if (!value || value.trim().length === 0) return 900
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 60 || parsed > 3600) {
      throw new Error(`Invalid S3_PRESIGN_TTL_SECONDS: "${value}" (expected integer 60..3600)`)
    }
    return parsed
  }

  get s3MaxUploadBytes(): number {
    const value = this.config.get<string>('S3_MAX_UPLOAD_BYTES', { infer: true })
    if (!value || value.trim().length === 0) return 10 * 1024 * 1024
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(`Invalid S3_MAX_UPLOAD_BYTES: "${value}"`)
    }
    return parsed
  }

  get emailFrom(): string {
    const value = this.config.get<string>('EMAIL_FROM', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing EMAIL_FROM')
    }
    return value
  }

  get emailReplyTo(): string | null {
    const value = this.config.get<string>('EMAIL_REPLY_TO', { infer: true })
    if (!value || value.trim().length === 0) return null
    return value
  }

  get smtpHost(): string {
    const value = this.config.get<string>('SMTP_HOST', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing SMTP_HOST')
    }
    return value
  }

  get smtpPort(): number {
    const value = this.config.get<string>('SMTP_PORT', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing SMTP_PORT')
    }
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
      throw new Error(`Invalid SMTP_PORT: "${value}"`)
    }
    return parsed
  }

  get smtpSecure(): boolean {
    const value = this.config.get<string>('SMTP_SECURE', { infer: true })
    return value === 'true' || value === '1'
  }

  get smtpUser(): string | null {
    const value = this.config.get<string>('SMTP_USER', { infer: true })
    if (!value || value.trim().length === 0) return null
    return value
  }

  get smtpPassword(): string | null {
    const value = this.config.get<string>('SMTP_PASSWORD', { infer: true })
    if (!value || value.trim().length === 0) return null
    return value
  }

  /**
   * URL pública do frontend, usada para montar links em emails (ex.: convite de
   * ativação de conta). Sem barra final.
   */
  get webBaseUrl(): string {
    const value = this.config.get<string>('WEB_BASE_URL', { infer: true })
    if (!value || value.trim().length === 0) {
      throw new Error('Missing WEB_BASE_URL')
    }
    return value.trim().replace(/\/+$/, '')
  }

  /**
   * Tempo de vida (em horas) de um convite de ativação. Default 72h.
   */
  get invitationTtlHours(): number {
    const value = this.config.get<string>('INVITATION_TTL_HOURS', { infer: true })
    if (!value || value.trim().length === 0) return 72
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 24 * 30) {
      throw new Error(`Invalid INVITATION_TTL_HOURS: "${value}" (expected integer 1..720)`)
    }
    return parsed
  }

  /** `maxAge` em ms dos cookies httpOnly do access JWT (alinha aos env de JWT access). */
  get jwtAccessTtlMs(): number {
    return parseDurationToMilliseconds(this.jwtAccessExpiresIn, 'JWT_ACCESS_EXPIRES_IN')
  }

  /** `maxAge` em ms do cookie httpOnly do refresh opaco (alinha a `JWT_REFRESH_EXPIRES_IN`). */
  get jwtRefreshTtlMs(): number {
    return parseDurationToMilliseconds(this.jwtRefreshExpiresIn, 'JWT_REFRESH_EXPIRES_IN')
  }

  /**
   * Origens permitidas para CORS (vírgula). Em PROD, lista vazia = CORS desligado (defina explicitamente).
   * Em DEV/TEST, lista vazia = `true` (qualquer origem).
   */
  get corsOrigins(): true | string[] {
    const raw = this.config.get<string>('CORS_ORIGINS', { infer: true })
    if (!raw || raw.trim() === '') {
      if (this.envMode === 'PROD') {
        return []
      }
      return true
    }
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }
}

function parseDurationToMilliseconds(expression: string, label: string): number {
  const s = expression.trim()
  const m = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(s)
  if (!m) {
    throw new Error(
      `Duração inválida (${label}): "${expression}" (formato exemplo: 10m, 24h, 7d; também ms ou s).`,
    )
  }
  const amount = Number(m[1])
  const unit = m[2].toLowerCase()
  const multiplier: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  }
  return amount * multiplier[unit]
}
