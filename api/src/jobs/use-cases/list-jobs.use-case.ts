import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

@Injectable()
export class ListJobsUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute() {
    const tenantId = this.tenantContext.getTenantId()
    if (tenantId === null) throw new BadRequestException('Missing X-Tenant-ID header')

    return this.prisma.job.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
  }
}

