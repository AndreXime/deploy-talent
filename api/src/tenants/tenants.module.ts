import { Module } from '@nestjs/common'
import { TenantsController } from './tenants.controller'
import { ActivateTenantUseCase } from './use-cases/activate-tenant.use-case'
import { CreateTenantUseCase } from './use-cases/create-tenant.use-case'
import { ListTenantsUseCase } from './use-cases/list-tenants.use-case'
import { SoftDeleteTenantUseCase } from './use-cases/soft-delete-tenant.use-case'
import { SuspendTenantUseCase } from './use-cases/suspend-tenant.use-case'

@Module({
  controllers: [TenantsController],
  providers: [
    CreateTenantUseCase,
    ListTenantsUseCase,
    SuspendTenantUseCase,
    ActivateTenantUseCase,
    SoftDeleteTenantUseCase,
  ],
})
export class TenantsModule {}
