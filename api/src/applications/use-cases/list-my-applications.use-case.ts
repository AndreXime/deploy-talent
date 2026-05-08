import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { ApplicationStatus, PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { resolvePagination } from '../../common/dto/pagination-query.dto'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import type { Actor } from './application.actor'

export interface ListMyApplicationsInput {
  page?: number
  limit?: number
  status?: ApplicationStatus
}

@Injectable()
export class ListMyApplicationsUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(actor: Actor, input: ListMyApplicationsInput = {}) {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can list own applications')
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { userId: actor.userId, deletedAt: null },
      select: { id: true },
    })
    if (!candidate) throw new NotFoundException('Candidate profile not found')

    const { page, limit, skip, take } = resolvePagination(input.page, input.limit)
    const where: { candidateId: string; status?: ApplicationStatus } = {
      candidateId: candidate.id,
    }
    if (input.status !== undefined) {
      where.status = input.status
    }

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: { job: true, tenant: { select: { id: true, name: true, slug: true, logoKey: true, bannerKey: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.application.count({ where }),
    ])

    return { items, total, page, limit }
  }
}
