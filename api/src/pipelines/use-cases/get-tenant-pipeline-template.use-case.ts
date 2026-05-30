import { Inject, Injectable } from '@nestjs/common'
import { PipelineStageKind, type PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

export interface TenantPipelineStageView {
  id: string
  position: number
  kind: PipelineStageKind
  name: string
  config: Record<string, unknown>
  required: boolean
}

export interface TenantPipelineTemplateView {
  id: string
  name: string
  stages: TenantPipelineStageView[]
}

/**
 * Retorna o template de pipeline default do tenant atual. Se ainda não
 * existir, cria um com uma única etapa MANUAL "Triagem" para que a UI tenha
 * sempre algo para mostrar.
 */
@Injectable()
export class GetTenantPipelineTemplateUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(): Promise<TenantPipelineTemplateView> {
    const tenantId = this.tenantContext.requireTenantId()
    const existing = await this.prisma.pipelineTemplate.findUnique({
      where: { tenantId },
      include: { stages: { orderBy: { position: 'asc' } } },
    })
    if (existing) return toView(existing)

    const created = await this.prisma.pipelineTemplate.create({
      data: {
        tenantId,
        stages: {
          create: [
            {
              position: 0,
              kind: PipelineStageKind.MANUAL,
              name: 'Triagem',
              config: {},
              required: true,
            },
          ],
        },
      },
      include: { stages: { orderBy: { position: 'asc' } } },
    })
    return toView(created)
  }
}

function toView(template: {
  id: string
  name: string
  stages: Array<{
    id: string
    position: number
    kind: PipelineStageKind
    name: string
    config: unknown
    required: boolean
  }>
}): TenantPipelineTemplateView {
  return {
    id: template.id,
    name: template.name,
    stages: template.stages.map((s) => ({
      id: s.id,
      position: s.position,
      kind: s.kind,
      name: s.name,
      config: (s.config as Record<string, unknown>) ?? {},
      required: s.required,
    })),
  }
}
