import { Injectable } from '@nestjs/common'
import type { CookieOptions, Response } from 'express'
import { EnvService } from '../infra/env/env.service'
import { AUTH_ACCESS_COOKIE_NAME, AUTH_REFRESH_COOKIE_NAME } from './auth-cookies.constants'

@Injectable()
export class AuthCookiesService {
  constructor(private readonly env: EnvService) {}

  private baseCookieOptions(): CookieOptions {
    const secureOverride = this.env.cookieSecure
    return {
      path: '/',
      secure: secureOverride ?? this.env.envMode === 'PROD',
      httpOnly: true,
      sameSite: 'lax',
    }
  }

  attachTokens(res: Response, tokens: { access_token: string; refresh_token: string }): void {
    const base = this.baseCookieOptions()
    res.cookie(AUTH_ACCESS_COOKIE_NAME, tokens.access_token, {
      ...base,
      maxAge: this.env.jwtAccessTtlMs,
    })
    res.cookie(AUTH_REFRESH_COOKIE_NAME, tokens.refresh_token, {
      ...base,
      maxAge: this.env.jwtRefreshTtlMs,
    })
  }

  clear(res: Response): void {
    const base = this.baseCookieOptions()
    res.clearCookie(AUTH_ACCESS_COOKIE_NAME, base)
    res.clearCookie(AUTH_REFRESH_COOKIE_NAME, base)
  }
}
