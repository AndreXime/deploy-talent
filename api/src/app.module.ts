import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core'
import { AppController } from './app.controller'
import { ApplicationsModule } from './applications/applications.module'
import { AuthModule } from './auth/auth.module'
import { RolesGuard } from './auth/rbac/roles.guard'
import { CandidatesModule } from './candidates/candidates.module'
import { EmailModule } from './infra/email/email.module'
import { EnvModule } from './infra/env/env.module'
import { PrismaModule } from './infra/prisma/prisma.module'
import { StorageModule } from './infra/storage/storage.module'
import { JobsModule } from './jobs/jobs.module'
import { TenantContextInterceptor } from './tenant-context/tenant-context.interceptor'
import { TenantContextModule } from './tenant-context/tenant-context.module'
import { TenantsModule } from './tenants/tenants.module'

@Module({
  imports: [
    EnvModule,
    TenantContextModule,
    PrismaModule,
    AuthModule,
    TenantsModule,
    JobsModule,
    CandidatesModule,
    ApplicationsModule,
    StorageModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
