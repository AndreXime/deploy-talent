import { Module } from '@nestjs/common'
import { JobPipelineController } from './job-pipeline.controller'
import { TenantPipelineController } from './tenant-pipeline.controller'
import { GetMyCurrentStageUseCase } from './use-cases/get-my-current-stage.use-case'
import { GetTenantPipelineTemplateUseCase } from './use-cases/get-tenant-pipeline-template.use-case'
import { ListApplicationProgressUseCase } from './use-cases/list-application-progress.use-case'
import { ListJobStagesUseCase } from './use-cases/list-job-stages.use-case'
import { MoveApplicationStageUseCase } from './use-cases/move-application-stage.use-case'
import { ReplaceJobStagesUseCase } from './use-cases/replace-job-stages.use-case'
import { ReplaceTenantPipelineTemplateUseCase } from './use-cases/replace-tenant-pipeline-template.use-case'
import { SetInterviewLinkUseCase } from './use-cases/set-interview-link.use-case'
import { SubmitCurrentStageUseCase } from './use-cases/submit-current-stage.use-case'

@Module({
  controllers: [TenantPipelineController, JobPipelineController],
  providers: [
    GetTenantPipelineTemplateUseCase,
    ReplaceTenantPipelineTemplateUseCase,
    ListJobStagesUseCase,
    ReplaceJobStagesUseCase,
    MoveApplicationStageUseCase,
    ListApplicationProgressUseCase,
    GetMyCurrentStageUseCase,
    SubmitCurrentStageUseCase,
    SetInterviewLinkUseCase,
  ],
  exports: [
    GetTenantPipelineTemplateUseCase,
    ListJobStagesUseCase,
    ReplaceJobStagesUseCase,
    MoveApplicationStageUseCase,
    ListApplicationProgressUseCase,
    GetMyCurrentStageUseCase,
    SubmitCurrentStageUseCase,
    SetInterviewLinkUseCase,
  ],
})
export class PipelinesModule {}
