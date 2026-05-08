import { Module } from '@nestjs/common'
import { CandidatesController } from './candidates.controller'
import { ForgetMeUseCase } from './use-cases/forget-me.use-case'
import { GetMyProfileUseCase } from './use-cases/get-my-profile.use-case'
import { UpdateMyProfileUseCase } from './use-cases/update-my-profile.use-case'

@Module({
  controllers: [CandidatesController],
  providers: [GetMyProfileUseCase, UpdateMyProfileUseCase, ForgetMeUseCase],
})
export class CandidatesModule {}
