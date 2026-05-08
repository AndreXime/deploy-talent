import { JwtService } from '@nestjs/jwt'
import type { User } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { LoginUseCase } from './login.use-case'

describe('LoginUseCase', () => {
  it('signs jwt with user payload', async () => {
    const jwtService = {
      signAsync: jest.fn(async () => 'signed.jwt'),
    }
    const useCase = new LoginUseCase(jwtService as unknown as JwtService)

    const user = {
      id: 'u1',
      email: 'a@a.com',
      tenantId: null,
      role: UserRole.CANDIDATE,
      passwordHash: 'x',
    } as unknown as User

    const result = await useCase.execute(user)

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      tenantId: null,
      role: UserRole.CANDIDATE,
    })
    expect(result).toEqual({ access_token: 'signed.jwt' })
  })
})
