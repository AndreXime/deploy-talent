import { Module } from '@nestjs/common'
import { ApplicationsController } from './applications.controller'
import { ApplyToJobUseCase } from './use-cases/apply-to-job.use-case'
import { CreateEvaluationUseCase } from './use-cases/create-evaluation.use-case'
import { ListApplicationsForTenantUseCase } from './use-cases/list-applications-for-tenant.use-case'
import { ListMyApplicationsUseCase } from './use-cases/list-my-applications.use-case'
import { MoveApplicationUseCase } from './use-cases/move-application.use-case'
import { SourceCandidateUseCase } from './use-cases/source-candidate.use-case'

@Module({
  controllers: [ApplicationsController],
  providers: [
    ApplyToJobUseCase,
    SourceCandidateUseCase,
    ListApplicationsForTenantUseCase,
    ListMyApplicationsUseCase,
    MoveApplicationUseCase,
    CreateEvaluationUseCase,
  ],
})
export class ApplicationsModule {}
