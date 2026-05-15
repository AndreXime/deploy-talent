import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { ExtractJwt } from 'passport-jwt'
import { AUTH_ACCESS_COOKIE_NAME } from './auth-cookies.constants'
import type { JwtPayload } from './jwt-payload'

/** Lê Bearer ou cookie de access; usado antes do Passport em rotas públicas opcionais. */
@Injectable()
export class AuthSessionService {
  constructor(private readonly jwt: JwtService) {}

  verifyAccessToken(accessToken: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(accessToken)
  }

  tryReadAccessPayload(req: Request): JwtPayload | null {
    const bearerRaw = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    const cookieRaw = req.cookies?.[AUTH_ACCESS_COOKIE_NAME]
    const bearer = typeof bearerRaw === 'string' && bearerRaw.length > 0 ? bearerRaw : null
    const cookie = typeof cookieRaw === 'string' && cookieRaw.length > 0 ? cookieRaw : null
    const token = bearer ?? cookie
    if (!token) return null
    try {
      const payload = this.jwt.verify<JwtPayload>(token)
      if (payload.typ === 'refresh') return null
      return payload
    } catch {
      return null
    }
  }

  publicClaims(tokens: { access_token: string }): {
    sub: string
    role: string
    tenantId: string | null
  } {
    const payload = this.verifyAccessToken(tokens.access_token)
    if (payload.typ === 'refresh') {
      throw new UnauthorizedException()
    }
    return { sub: payload.sub, role: payload.role, tenantId: payload.tenantId }
  }
}
