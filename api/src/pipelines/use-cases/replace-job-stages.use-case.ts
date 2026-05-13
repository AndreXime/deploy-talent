import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  JobStatus,
  type PipelineStageKind,
  type PrismaClient,
} from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { validateStageConfig } from '../stage-config'
import { type JobStageView, ListJobStagesUseCase } from './list-job-stages.use-case'

export interface ReplaceJobStageInput {
  kind: PipelineStageKind
  name: string
  config?: unknown
  required?: boolean
}

export interface ReplaceJobStagesInput {
  stages: ReplaceJobStageInput[]
}

@Injectable()
export class ReplaceJobStagesUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly listStages: ListJobStagesUseCase,
  ) {}

  async execute(jobId: string, input: ReplaceJobStagesInput): Promise<JobStageView[]> {
    const tenantId = this.tenantContext.requireTenantId()
    if (!Array.isArray(input.stages) || input.stages.length === 0) {
      throw new BadRequestException('Pipeline da vaga precisa de pelo menos uma etapa')
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { tenantId: true, status: true },
    })
    if (!job) throw new NotFoundException('Job not found')
    if (job.tenantId !== tenantId) throw new ForbiddenException('Job belongs to another tenant')
    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException(
        'Etapas só podem ser editadas em vagas DRAFT. Pause ou volte ao DRAFT primeiro.',
      )
    }

    const normalized = input.stages.map((stage, idx) => {
      const name = stage.name?.trim()
      if (!name) throw new BadRequestException(`Etapa na posição ${idx} sem nome`)
      const config = validateStageConfig(stage.kind, stage.config)
      return {
        jobId,
        position: idx,
        kind: stage.kind,
        name,
        config: config as object,
        required: stage.required ?? true,
      }
    })

    await this.prisma.$transaction(async (tx) => {
      await tx.jobStage.deleteMany({ where: { jobId } })
      await tx.jobStage.createMany({ data: normalized })
    })

    return this.listStages.execute(jobId)
  }
}
