import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import type { User } from '../../../generated/prisma/client'
import { ValidateLocalUserUseCase } from '../use-cases/validate-local-user.use-case'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly validateLocalUser: ValidateLocalUserUseCase) {
    super({ usernameField: 'email' })
  }

  async validate(email: string, password: string): Promise<User> {
    return this.validateLocalUser.execute(email, password)
  }
}
