import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { CandidateProfileReadService } from '../../candidates/candidate-profile-read.service'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { Actor } from './application.actor'

@Injectable()
export class GetApplicationForTenantUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly candidateRead: CandidateProfileReadService,
  ) {}

  async execute(actor: Actor, applicationId: string) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can view application details')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const app = await this.prisma.application.findFirst({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: true,
      },
    })
    if (!app) throw new NotFoundException('Application not found')
    return {
      ...app,
      candidate: await this.candidateRead.toApiRead(app.candidate),
    }
  }
}
