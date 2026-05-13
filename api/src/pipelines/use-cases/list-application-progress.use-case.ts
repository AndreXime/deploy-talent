import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

@Injectable()
export class ListApplicationProgressUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, applicationId: string) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can list application progress')
    }
    const tenantId = this.tenantContext.requireTenantId()
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId },
      select: { id: true },
    })
    if (!application) throw new NotFoundException('Application not found')

    return this.prisma.applicationStageProgress.findMany({
      where: { applicationId },
      orderBy: { jobStage: { position: 'asc' } },
    })
  }
}
