import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { LoginUseCase } from '../../auth/use-cases/login.use-case'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { hashInvitationToken } from '../invitation-token'

@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async execute(rawToken: string, password: string) {
    const tokenHash = hashInvitationToken(rawToken)

    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: {
        tenant: { select: { id: true, isActive: true, deletedAt: true } },
      },
    })

    if (!invitation) throw new NotFoundException('Invalid invitation token')
    if (invitation.acceptedAt) throw new ConflictException('Invitation already accepted')
    if (invitation.revokedAt) throw new NotFoundException('Invitation revoked')
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('Invitation expired')
    }

    if (invitation.role !== UserRole.TENANT_ADMIN) {
      throw new BadRequestException('Unsupported invitation role')
    }

    if (
      !invitation.tenant ||
      invitation.tenant.deletedAt !== null ||
      invitation.tenant.isActive === false
    ) {
      throw new BadRequestException('Tenant unavailable')
    }

    const emailClash = await this.prisma.user.findFirst({
      where: { email: invitation.email },
      select: { id: true },
    })
    if (emailClash) throw new ConflictException('Email already in use')

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date()

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          role: invitation.role,
          tenantId: invitation.tenant?.id ?? null,
        },
      })

      const consumed = await tx.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, revokedAt: null },
        data: { acceptedAt: now },
      })

      if (consumed.count !== 1) {
        throw new ConflictException('Invitation already accepted')
      }

      return created
    })

    return this.loginUseCase.execute(user)
  }
}
