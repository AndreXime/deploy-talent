import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { User } from '../../../generated/prisma/client'
import type { JwtPayload } from '../jwt-payload'

@Injectable()
export class LoginUseCase {
  constructor(private readonly jwtService: JwtService) {}

  async execute(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId ?? null,
      role: user.role,
    }

    return {
      access_token: await this.jwtService.signAsync(payload),
    }
  }
}
