import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { PipelineStageKind, type PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { CreateJobDto } from '../dto/create-job.dto'

@Injectable()
export class CreateJobUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(input: CreateJobDto) {
    const tenantId = this.tenantContext.getTenantId()
    if (tenantId === null) {
      throw new BadRequestException('Missing tenant context')
    }

    const templateStages = await this.prisma.templateStage.findMany({
      where: { template: { tenantId } },
      orderBy: { position: 'asc' },
      select: { position: true, kind: true, name: true, config: true, required: true },
    })

    return this.prisma.job.create({
      data: {
        tenantId,
        title: input.title,
        description: input.description,
        modality: input.modality,
        location: input.location,
        seniority: input.seniority,
        status: input.status,
        stages: {
          create: templateStages.length
            ? templateStages.map((s) => ({
                position: s.position,
                kind: s.kind,
                name: s.name,
                config: (s.config ?? {}) as object,
                required: s.required,
              }))
            : [
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
    })
  }
}
