import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { type PipelineStageKind, type PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { validateStageConfig } from '../stage-config'
import {
  GetTenantPipelineTemplateUseCase,
  type TenantPipelineTemplateView,
} from './get-tenant-pipeline-template.use-case'

export interface ReplaceTemplateStageInput {
  kind: PipelineStageKind
  name: string
  config?: unknown
  required?: boolean
}

export interface ReplaceTenantPipelineTemplateInput {
  stages: ReplaceTemplateStageInput[]
}

@Injectable()
export class ReplaceTenantPipelineTemplateUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly getTemplate: GetTenantPipelineTemplateUseCase,
  ) {}

  async execute(input: ReplaceTenantPipelineTemplateInput): Promise<TenantPipelineTemplateView> {
    const tenantId = this.tenantContext.requireTenantId()
    if (!Array.isArray(input.stages) || input.stages.length === 0) {
      throw new BadRequestException('Pipeline precisa de pelo menos uma etapa')
    }

    const normalized = input.stages.map((stage, idx) => {
      const name = stage.name?.trim()
      if (!name) {
        throw new BadRequestException(`Etapa na posição ${idx} sem nome`)
      }
      const config = validateStageConfig(stage.kind, stage.config)
      return {
        position: idx,
        kind: stage.kind,
        name,
        config: config as object,
        required: stage.required ?? true,
      }
    })

    await this.prisma.$transaction(async (tx) => {
      const template = await tx.pipelineTemplate.upsert({
        where: { tenantId },
        create: { tenantId },
        update: {},
        select: { id: true },
      })
      await tx.templateStage.deleteMany({ where: { templateId: template.id } })
      await tx.templateStage.createMany({
        data: normalized.map((s) => ({ templateId: template.id, ...s })),
      })
    })

    return this.getTemplate.execute()
  }
}
