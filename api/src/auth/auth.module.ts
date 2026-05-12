import { Module } from '@nestjs/common'
import type { JwtSignOptions } from '@nestjs/jwt'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { EnvService } from '../infra/env/env.service'
import { AuthController } from './auth.controller'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { GetMyB2BAccountUseCase } from './use-cases/get-my-b2b-account.use-case'
import { LoginUseCase } from './use-cases/login.use-case'
import { RegisterCandidateUseCase } from './use-cases/register-candidate.use-case'
import { UpdateB2BAvatarUseCase } from './use-cases/update-b2b-avatar.use-case'
import { ValidateLocalUserUseCase } from './use-cases/validate-local-user.use-case'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: async (env: EnvService) => {
        return {
          secret: env.jwtSecret,
          signOptions: {
            expiresIn: env.jwtExpiresIn as JwtSignOptions['expiresIn'],
          },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterCandidateUseCase,
    UpdateB2BAvatarUseCase,
    GetMyB2BAccountUseCase,
    ValidateLocalUserUseCase,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, LoginUseCase],
})
export class AuthModule {}
