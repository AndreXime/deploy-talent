import { Module } from '@nestjs/common'
import { TenantsController } from './tenants.controller'
import { TenantsPublicController } from './tenants-public.controller'
import { ActivateTenantUseCase } from './use-cases/activate-tenant.use-case'
import { CreateTenantUseCase } from './use-cases/create-tenant.use-case'
import { GetCurrentTenantUseCase } from './use-cases/get-current-tenant.use-case'
import { GetTenantBySlugUseCase } from './use-cases/get-tenant-by-slug.use-case'
import { ListCurrentTenantRecruitersUseCase } from './use-cases/list-current-tenant-recruiters.use-case'
import { ListTenantsUseCase } from './use-cases/list-tenants.use-case'
import { RemoveTenantRecruiterUseCase } from './use-cases/remove-tenant-recruiter.use-case'
import { SoftDeleteTenantUseCase } from './use-cases/soft-delete-tenant.use-case'
import { SuspendTenantUseCase } from './use-cases/suspend-tenant.use-case'
import { UpdateTenantBrandingUseCase } from './use-cases/update-tenant-branding.use-case'

@Module({
  controllers: [TenantsController, TenantsPublicController],
  providers: [
    CreateTenantUseCase,
    ListTenantsUseCase,
    SuspendTenantUseCase,
    ActivateTenantUseCase,
    SoftDeleteTenantUseCase,
    UpdateTenantBrandingUseCase,
    GetTenantBySlugUseCase,
    GetCurrentTenantUseCase,
    ListCurrentTenantRecruitersUseCase,
    RemoveTenantRecruiterUseCase,
  ],
})
export class TenantsModule {}
