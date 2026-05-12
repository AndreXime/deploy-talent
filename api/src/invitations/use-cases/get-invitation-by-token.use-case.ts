import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { hashInvitationToken } from '../invitation-token'

@Injectable()
export class GetInvitationByTokenUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(rawToken: string) {
    const tokenHash = hashInvitationToken(rawToken)

    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      select: {
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        tenant: { select: { id: true, name: true, isActive: true, deletedAt: true } },
      },
    })

    if (!invitation) throw new NotFoundException('Invalid invitation token')
    if (invitation.acceptedAt) throw new NotFoundException('Invitation already accepted')
    if (invitation.revokedAt) throw new NotFoundException('Invitation revoked')
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('Invitation expired')
    }
    if (
      invitation.tenant &&
      (invitation.tenant.deletedAt !== null || invitation.tenant.isActive === false)
    ) {
      throw new NotFoundException('Tenant unavailable')
    }

    return {
      email: invitation.email,
      role: invitation.role,
      tenantName: invitation.tenant?.name ?? null,
      expiresAt: invitation.expiresAt,
    }
  }
}
