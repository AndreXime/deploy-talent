import { Module } from '@nestjs/common'
import { JobsController } from './jobs.controller'
import { ChangeJobStatusUseCase } from './use-cases/change-job-status.use-case'
import { CreateJobUseCase } from './use-cases/create-job.use-case'
import { ListJobsUseCase } from './use-cases/list-jobs.use-case'
import { UpdateJobUseCase } from './use-cases/update-job.use-case'

@Module({
  controllers: [JobsController],
  providers: [CreateJobUseCase, ListJobsUseCase, UpdateJobUseCase, ChangeJobStatusUseCase],
})
export class JobsModule {}
