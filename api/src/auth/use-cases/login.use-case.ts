import { Inject, Injectable } from '@nestjs/common'
import type { JwtSignOptions } from '@nestjs/jwt'
import { JwtService } from '@nestjs/jwt'
import type { Prisma, PrismaClient, User } from '../../../generated/prisma/client'
import { EnvService } from '../../infra/env/env.service'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { addJwtExpiresStringToDate } from '../jwt-expires-in'
import type { JwtPayload } from '../jwt-payload'
import { generateOpaqueRefreshToken } from '../refresh-token-crypto'

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly env: EnvService,
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async execute(user: User, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma

    const base: Omit<JwtPayload, 'typ'> = {
      sub: user.id,
      tenantId: user.tenantId ?? null,
      role: user.role,
    }

    const accessPayload: JwtPayload = { ...base, typ: 'access' }

    const accessOptions: JwtSignOptions = {
      expiresIn: this.env.jwtAccessExpiresIn as JwtSignOptions['expiresIn'],
    }

    const access_token = await this.jwtService.signAsync(accessPayload, accessOptions)

    const { raw, hash } = generateOpaqueRefreshToken()
    const expiresAt = addJwtExpiresStringToDate(new Date(), this.env.jwtRefreshExpiresIn)

    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt,
      },
    })

    return { access_token, refresh_token: raw }
  }
}
