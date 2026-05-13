import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PipelineStageKind, type PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

export interface JobStageView {
  id: string
  position: number
  kind: PipelineStageKind
  name: string
  config: Record<string, unknown>
  required: boolean
}

@Injectable()
export class ListJobStagesUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(jobId: string): Promise<JobStageView[]> {
    const tenantId = this.tenantContext.requireTenantId()
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { tenantId: true },
    })
    if (!job) throw new NotFoundException('Job not found')
    if (job.tenantId !== tenantId) {
      throw new ForbiddenException('Job belongs to another tenant')
    }

    const stages = await this.prisma.jobStage.findMany({
      where: { jobId },
      orderBy: { position: 'asc' },
    })
    return stages.map((s) => ({
      id: s.id,
      position: s.position,
      kind: s.kind,
      name: s.name,
      config: (s.config as Record<string, unknown>) ?? {},
      required: s.required,
    }))
  }
}
