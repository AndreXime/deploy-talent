import { Module } from '@nestjs/common'
import { CandidateApplicationEmailNotifier } from './candidate-application-email.notifier'

@Module({
  providers: [CandidateApplicationEmailNotifier],
  exports: [CandidateApplicationEmailNotifier],
})
export class CandidateEmailModule {}
