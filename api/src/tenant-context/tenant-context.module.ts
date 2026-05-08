import { Global, Module } from '@nestjs/common'
import { TenantGuard } from './tenant.guard'
import { TenantContextMiddleware } from './tenant-context.middleware'
import { TenantContextService } from './tenant-context.service'

@Global()
@Module({
  providers: [TenantContextService, TenantContextMiddleware, TenantGuard],
  exports: [TenantContextService, TenantContextMiddleware, TenantGuard],
})
export class TenantContextModule {}
