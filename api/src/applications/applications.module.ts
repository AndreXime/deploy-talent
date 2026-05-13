import { Module } from '@nestjs/common'
import { CandidatesModule } from '../candidates/candidates.module'
import { InvitationsModule } from '../invitations/invitations.module'
import { PipelinesModule } from '../pipelines/pipelines.module'
import { ApplicationsController } from './applications.controller'
import { CandidateApplicationEmailNotifier } from './candidate-application-email.notifier'
import { TenantCandidateApplicationsController } from './tenant-candidate-applications.controller'
import { ApplyToJobUseCase } from './use-cases/apply-to-job.use-case'
import { GetApplicationForTenantUseCase } from './use-cases/get-application-for-tenant.use-case'
import { GetMyApplicationUseCase } from './use-cases/get-my-application.use-case'
import { ListApplicationsForTenantUseCase } from './use-cases/list-applications-for-tenant.use-case'
import { ListMyApplicationsUseCase } from './use-cases/list-my-applications.use-case'
import { MoveApplicationUseCase } from './use-cases/move-application.use-case'
import { SourceCandidateUseCase } from './use-cases/source-candidate.use-case'
import { WithdrawMyApplicationUseCase } from './use-cases/withdraw-my-application.use-case'

@Module({
  imports: [CandidatesModule, InvitationsModule, PipelinesModule],
  controllers: [ApplicationsController, TenantCandidateApplicationsController],
  providers: [
    CandidateApplicationEmailNotifier,
    ApplyToJobUseCase,
    SourceCandidateUseCase,
    ListApplicationsForTenantUseCase,
    ListMyApplicationsUseCase,
    GetApplicationForTenantUseCase,
    GetMyApplicationUseCase,
    WithdrawMyApplicationUseCase,
    MoveApplicationUseCase,
  ],
})
export class ApplicationsModule {}
