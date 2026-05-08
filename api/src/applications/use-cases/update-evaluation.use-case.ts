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
import type { UpdateEvaluationDto } from '../dto/update-evaluation.dto'
import type { Actor } from './application.actor'

@Injectable()
export class UpdateEvaluationUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, evaluationId: string, input: UpdateEvaluationDto) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can update evaluations')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const existing = await this.prisma.evaluation.findFirst({
      where: { id: evaluationId },
    })
    if (!existing) throw new NotFoundException('Evaluation not found')

    const data: { score?: number | null; notes?: string | null } = {}
    if (input.score !== undefined) data.score = input.score
    if (input.notes !== undefined) data.notes = input.notes

    return this.prisma.evaluation.update({
      where: { id: evaluationId },
      data,
    })
  }
}
