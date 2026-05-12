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
import type { CreateEvaluationDto } from '../dto/create-evaluation.dto'
import type { Actor } from './application.actor'

@Injectable()
export class CreateEvaluationUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, input: CreateEvaluationDto) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can evaluate')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const app = await this.prisma.application.findFirst({
      where: { id: input.applicationId, tenantId },
      select: { id: true },
    })
    if (!app) throw new NotFoundException('Application not found')

    return this.prisma.evaluation.create({
      data: {
        tenantId,
        applicationId: app.id,
        createdByUserId: actor.userId,
        score: input.score,
        notes: input.notes,
      },
    })
  }
}
