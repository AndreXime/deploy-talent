import { BadRequestException, ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { EnvService } from '../../infra/env/env.service'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { InvitationEmailNotifier } from '../invitation-email.notifier'
import { generateInvitationToken } from '../invitation-token'

export interface InviteRecruiterInput {
  email: string
  invitedByUserId: string
}

@Injectable()
export class InviteRecruiterUseCase {
  private readonly logger = new Logger(InviteRecruiterUseCase.name)

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly env: EnvService,
    private readonly notifier: InvitationEmailNotifier,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(input: InviteRecruiterInput) {
    const email = input.email.trim().toLowerCase()
    const tenantId = this.tenantContext.requireTenantId()

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null, isActive: true },
      select: { id: true, name: true },
    })
    if (!tenant) throw new BadRequestException('Invalid tenant')

    const existingUser = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    })
    if (existingUser) {
      throw new ConflictException('Email already in use')
    }

    await this.prisma.invitation.updateMany({
      where: {
        email,
        tenantId: tenant.id,
        role: UserRole.RECRUITER,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })

    const { raw, hash } = generateInvitationToken()
    const expiresAt = new Date(Date.now() + this.env.invitationTtlHours * 60 * 60 * 1000)

    const invitation = await this.prisma.invitation.create({
      data: {
        email,
        role: UserRole.RECRUITER,
        tenantId: tenant.id,
        tokenHash: hash,
        invitedByUserId: input.invitedByUserId,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        expiresAt: true,
      },
    })

    try {
      await this.notifier.notifyRecruiterInvited({
        recipientEmail: email,
        tenantName: tenant.name,
        inviterName: null,
        rawToken: raw,
        expiresAt,
      })
    } catch (err) {
      await this.prisma.invitation
        .update({
          where: { id: invitation.id },
          data: { revokedAt: new Date() },
        })
        .catch((rollbackErr) => {
          this.logger.error(
            `Falha a reverter convite ${invitation.id} após erro de envio`,
            rollbackErr as Error,
          )
        })
      throw err
    }

    return invitation
  }
}
