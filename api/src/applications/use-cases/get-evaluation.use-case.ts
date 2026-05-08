import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { Actor } from './application.actor'

@Injectable()
export class GetEvaluationUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, evaluationId: string) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can view evaluations')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const evaluation = await this.prisma.evaluation.findFirst({
      where: { id: evaluationId },
    })
    if (!evaluation) throw new NotFoundException('Evaluation not found')
    return evaluation
  }
}
