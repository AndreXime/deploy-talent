import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { JobStatus, type PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

@Injectable()
export class GetPublicJobUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(jobId: string) {
    const tenantId = this.tenantContext.getTenantId()
    if (tenantId === null) throw new BadRequestException('Missing tenant context')

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        status: { in: [JobStatus.PUBLISHED, JobStatus.PAUSED] },
      },
    })
    if (!job) throw new NotFoundException('Job not found')
    return job
  }
}
