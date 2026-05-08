import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { JobStatus, type PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { UpdateJobDto } from '../dto/update-job.dto'

@Injectable()
export class UpdateJobUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(jobId: string, input: UpdateJobDto) {
    const tenantId = this.tenantContext.getTenantId()
    if (tenantId === null) throw new BadRequestException('Missing tenant context')

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    })
    if (!job) throw new NotFoundException('Job not found')

    if (job.status === JobStatus.CLOSED) {
      throw new ForbiddenException('Closed jobs cannot be edited')
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: input.title,
        description: input.description,
        modality: input.modality,
        location: input.location,
        seniority: input.seniority,
      },
    })
  }
}

