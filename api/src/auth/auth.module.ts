import { Module } from '@nestjs/common'
import type { JwtSignOptions } from '@nestjs/jwt'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { EnvService } from '../infra/env/env.service'
import { AuthController } from './auth.controller'
import { RefreshTokensCleanupTask } from './refresh-tokens-cleanup.task'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { GetMyB2BAccountUseCase } from './use-cases/get-my-b2b-account.use-case'
import { LoginUseCase } from './use-cases/login.use-case'
import { LogoutUseCase } from './use-cases/logout.use-case'
import { RefreshTokensUseCase } from './use-cases/refresh-tokens.use-case'
import { RegisterCandidateUseCase } from './use-cases/register-candidate.use-case'
import { RegisterTenantAdminUseCase } from './use-cases/register-tenant-admin.use-case'
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
            expiresIn: env.jwtAccessExpiresIn as JwtSignOptions['expiresIn'],
          },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    RegisterCandidateUseCase,
    RegisterTenantAdminUseCase,
    UpdateB2BAvatarUseCase,
    GetMyB2BAccountUseCase,
    ValidateLocalUserUseCase,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    RefreshTokensCleanupTask,
  ],
  exports: [JwtAuthGuard, LoginUseCase],
})
export class AuthModule {}
