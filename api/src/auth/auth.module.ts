import { Module } from '@nestjs/common'
import type { JwtSignOptions } from '@nestjs/jwt'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { EnvService } from '../infra/env/env.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { CreateRecruiterUseCase } from './use-cases/create-recruiter.use-case'
import { CreateTenantAdminUseCase } from './use-cases/create-tenant-admin.use-case'
import { LoginUseCase } from './use-cases/login.use-case'
import { RegisterCandidateUseCase } from './use-cases/register-candidate.use-case'
import { UpdateB2BAvatarUseCase } from './use-cases/update-b2b-avatar.use-case'
import { ValidateLocalUserUseCase } from './use-cases/validate-local-user.use-case'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

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
    CreateTenantAdminUseCase,
    CreateRecruiterUseCase,
    UpdateB2BAvatarUseCase,
    ValidateLocalUserUseCase,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
