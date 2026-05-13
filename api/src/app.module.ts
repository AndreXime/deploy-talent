import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { ApplicationsModule } from './applications/applications.module'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { RolesGuard } from './auth/rbac/roles.guard'
import { CandidatesModule } from './candidates/candidates.module'
import { HealthModule } from './health/health.module'
import { EmailModule } from './infra/email/email.module'
import { EnvModule } from './infra/env/env.module'
import { PrismaModule } from './infra/prisma/prisma.module'
import { StorageModule } from './infra/storage/storage.module'
import { InvitationsModule } from './invitations/invitations.module'
import { JobsModule } from './jobs/jobs.module'
import { MediaModule } from './media/media.module'
import { PipelinesModule } from './pipelines/pipelines.module'
import { TenantContextInterceptor } from './tenant-context/tenant-context.interceptor'
import { TenantContextModule } from './tenant-context/tenant-context.module'
import { TenantsModule } from './tenants/tenants.module'

@Module({
  imports: [
    EnvModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 120,
        },
      ],
    }),
    TenantContextModule,
    PrismaModule,
    AuthModule,
    TenantsModule,
    JobsModule,
    CandidatesModule,
    ApplicationsModule,
    StorageModule,
    MediaModule,
    EmailModule,
    InvitationsModule,
    PipelinesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
