import { Module } from '@nestjs/common'
import { JobsController } from './jobs.controller'
import { MarketplaceJobsController } from './marketplace-jobs.controller'
import { TenantPublicJobsController } from './tenant-public-jobs.controller'
import { ChangeJobStatusUseCase } from './use-cases/change-job-status.use-case'
import { CreateJobUseCase } from './use-cases/create-job.use-case'
import { GetJobUseCase } from './use-cases/get-job.use-case'
import { GetMarketplaceJobFilterOptionsUseCase } from './use-cases/get-marketplace-job-filter-options.use-case'
import { GetPublicJobUseCase } from './use-cases/get-public-job.use-case'
import { ListJobsUseCase } from './use-cases/list-jobs.use-case'
import { ListMarketplaceJobsUseCase } from './use-cases/list-marketplace-jobs.use-case'
import { ListPublicJobsForTenantUseCase } from './use-cases/list-public-jobs-for-tenant.use-case'
import { UpdateJobUseCase } from './use-cases/update-job.use-case'

@Module({
  // Marketplace antes de JobsController: evita que GET jobs/:id consuma `/jobs/public`.
  controllers: [MarketplaceJobsController, JobsController, TenantPublicJobsController],
  providers: [
    CreateJobUseCase,
    ListJobsUseCase,
    GetJobUseCase,
    ListPublicJobsForTenantUseCase,
    ListMarketplaceJobsUseCase,
    GetMarketplaceJobFilterOptionsUseCase,
    GetPublicJobUseCase,
    UpdateJobUseCase,
    ChangeJobStatusUseCase,
  ],
})
export class JobsModule {}
