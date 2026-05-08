import { Module } from '@nestjs/common'
import { ApplicationsController } from './applications.controller'
import { TenantCandidateApplicationsController } from './tenant-candidate-applications.controller'
import { ApplyToJobUseCase } from './use-cases/apply-to-job.use-case'
import { CreateEvaluationUseCase } from './use-cases/create-evaluation.use-case'
import { GetApplicationForTenantUseCase } from './use-cases/get-application-for-tenant.use-case'
import { GetEvaluationUseCase } from './use-cases/get-evaluation.use-case'
import { GetMyApplicationUseCase } from './use-cases/get-my-application.use-case'
import { ListApplicationsForTenantUseCase } from './use-cases/list-applications-for-tenant.use-case'
import { ListEvaluationsForApplicationUseCase } from './use-cases/list-evaluations-for-application.use-case'
import { ListMyApplicationsUseCase } from './use-cases/list-my-applications.use-case'
import { MoveApplicationUseCase } from './use-cases/move-application.use-case'
import { SourceCandidateUseCase } from './use-cases/source-candidate.use-case'
import { UpdateEvaluationUseCase } from './use-cases/update-evaluation.use-case'
import { WithdrawMyApplicationUseCase } from './use-cases/withdraw-my-application.use-case'

@Module({
  controllers: [ApplicationsController, TenantCandidateApplicationsController],
  providers: [
    ApplyToJobUseCase,
    SourceCandidateUseCase,
    ListApplicationsForTenantUseCase,
    ListMyApplicationsUseCase,
    GetApplicationForTenantUseCase,
    GetMyApplicationUseCase,
    WithdrawMyApplicationUseCase,
    MoveApplicationUseCase,
    CreateEvaluationUseCase,
    ListEvaluationsForApplicationUseCase,
    GetEvaluationUseCase,
    UpdateEvaluationUseCase,
  ],
})
export class ApplicationsModule {}
