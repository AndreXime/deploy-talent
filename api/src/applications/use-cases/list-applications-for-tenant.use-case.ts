import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import type { ApplicationStatus, PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { resolvePagination } from '../../common/dto/pagination-query.dto'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import type { Actor } from './application.actor'

export interface ListApplicationsForTenantInput {
  page?: number
  limit?: number
  status?: ApplicationStatus
}

@Injectable()
export class ListApplicationsForTenantUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actor: Actor, input: ListApplicationsForTenantInput = {}) {
    if (actor.role !== UserRole.RECRUITER && actor.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenException('Only recruiters can list applications')
    }
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing tenant context')

    const { page, limit, skip, take } = resolvePagination(input.page, input.limit)
    const where = input.status !== undefined ? { status: input.status } : {}

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: { candidate: true, job: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.application.count({ where }),
    ])

    return { items, total, page, limit }
  }
}
