import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import type { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { EnvService } from '../../infra/env/env.service'
import { AUTH_ACCESS_COOKIE_NAME } from '../auth-cookies.constants'
import type { JwtPayload } from '../jwt-payload'

function accessTokenFromRequest(req: Request): string | null {
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
  if (typeof bearer === 'string' && bearer.length > 0) return bearer
  const cookie = req.cookies?.[AUTH_ACCESS_COOKIE_NAME]
  return typeof cookie === 'string' && cookie.length > 0 ? cookie : null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessTokenFromRequest]),
      ignoreExpiration: false,
      secretOrKey: env.jwtSecret,
    })
  }

  async validate(payload: JwtPayload) {
    if (payload.typ === 'refresh') {
      throw new UnauthorizedException('Invalid token type')
    }
    return payload
  }
}
