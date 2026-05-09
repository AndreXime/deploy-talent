import { Module } from '@nestjs/common'
import { CandidatesController } from './candidates.controller'
import { ForgetMeUseCase } from './use-cases/forget-me.use-case'
import { GetMyProfileUseCase } from './use-cases/get-my-profile.use-case'
import { ListSavedJobsUseCase } from './use-cases/list-saved-jobs.use-case'
import { SaveJobUseCase } from './use-cases/save-job.use-case'
import { UnsaveJobUseCase } from './use-cases/unsave-job.use-case'
import { UpdateMyProfileUseCase } from './use-cases/update-my-profile.use-case'

@Module({
  controllers: [CandidatesController],
  providers: [
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    ForgetMeUseCase,
    ListSavedJobsUseCase,
    SaveJobUseCase,
    UnsaveJobUseCase,
  ],
})
export class CandidatesModule {}
