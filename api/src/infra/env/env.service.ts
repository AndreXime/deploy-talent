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
