import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { InvitationEmailNotifier } from './invitation-email.notifier'
import { InvitationsController } from './invitations.controller'
import { AcceptInvitationUseCase } from './use-cases/accept-invitation.use-case'
import { GetInvitationByTokenUseCase } from './use-cases/get-invitation-by-token.use-case'
import { InviteRecruiterUseCase } from './use-cases/invite-recruiter.use-case'
import { InviteTenantAdminUseCase } from './use-cases/invite-tenant-admin.use-case'

@Module({
  imports: [AuthModule],
  controllers: [InvitationsController],
  providers: [
    InviteTenantAdminUseCase,
    InviteRecruiterUseCase,
    GetInvitationByTokenUseCase,
    AcceptInvitationUseCase,
    InvitationEmailNotifier,
  ],
})
export class InvitationsModule {}
