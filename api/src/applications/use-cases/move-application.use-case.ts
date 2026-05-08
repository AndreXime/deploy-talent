import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { MoveApplicationDto } from '../dto/move-application.dto'
import type { Actor } from './application.actor'

@Injectable()
export class MoveApplicationUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, applicationId: string, input: MoveApplicationDto) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can move applications')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing X-Tenant-ID header')

    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId },
    })
    if (!app) throw new NotFoundException('Application not found')

    if (!isValidApplicationTransition(app.status, input.status)) {
      throw new ForbiddenException(`Invalid application transition: ${app.status} -> ${input.status}`)
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: input.status,
        stage: input.stage,
      },
    })

    await this.prisma.applicationHistory.create({
      data: {
        tenantId,
        applicationId,
        movedByUserId: actor.userId,
        fromStatus: app.status,
        toStatus: input.status,
        fromStage: app.stage,
        toStage: input.stage ?? null,
      },
    })

    return updated
  }
}

function isValidApplicationTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to) return true
  const terminal = new Set<ApplicationStatus>([
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
    ApplicationStatus.HIRED,
  ])
  if (terminal.has(from)) return false

  switch (from) {
    case ApplicationStatus.SOURCED:
      return (
        to === ApplicationStatus.IN_PROGRESS ||
        to === ApplicationStatus.REJECTED ||
        to === ApplicationStatus.WITHDRAWN
      )
    case ApplicationStatus.APPLIED:
      return (
        to === ApplicationStatus.IN_PROGRESS ||
        to === ApplicationStatus.REJECTED ||
        to === ApplicationStatus.WITHDRAWN
      )
    case ApplicationStatus.IN_PROGRESS:
      return (
        to === ApplicationStatus.REJECTED ||
        to === ApplicationStatus.WITHDRAWN ||
        to === ApplicationStatus.HIRED
      )
    case ApplicationStatus.REJECTED:
    case ApplicationStatus.WITHDRAWN:
    case ApplicationStatus.HIRED:
      return false
  }
}

