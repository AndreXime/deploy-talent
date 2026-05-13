import { JwtService } from '@nestjs/jwt'
import type { PrismaClient, User } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { EnvService } from '../../infra/env/env.service'
import { LoginUseCase } from './login.use-case'

describe('LoginUseCase', () => {
  it('emite access JWT e persiste refresh opaco', async () => {
    const jwtService = {
      signAsync: jest.fn(async () => 'access.jwt'),
    }
    const env = {
      jwtAccessExpiresIn: '10m',
      jwtRefreshExpiresIn: '24h',
    } as unknown as EnvService

    const refreshCreate = jest.fn(async () => ({}))
    const prisma = {
      refreshToken: { create: refreshCreate },
    } as unknown as PrismaClient

    const useCase = new LoginUseCase(jwtService as unknown as JwtService, env, prisma)

    const user = {
      id: 'u1',
      email: 'a@a.com',
      tenantId: null,
      role: UserRole.CANDIDATE,
      passwordHash: 'x',
    } as unknown as User

    const result = await useCase.execute(user)

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'u1',
        tenantId: null,
        role: UserRole.CANDIDATE,
        typ: 'access',
      }),
      expect.objectContaining({ expiresIn: '10m' }),
    )
    expect(refreshCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    })
    expect(typeof result.refresh_token).toBe('string')
    expect(result.refresh_token.length).toBeGreaterThan(20)
    expect(result.access_token).toBe('access.jwt')
  })
})
