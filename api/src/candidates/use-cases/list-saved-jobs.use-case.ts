import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { resolvePagination } from '../../common/dto/pagination-query.dto'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'

const tenantSnippetSelect = {
  id: true,
  name: true,
  slug: true,
  logoKey: true,
  bannerKey: true,
} as const

export interface ListSavedJobsInput {
  page?: number
  limit?: number
}

@Injectable()
export class ListSavedJobsUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(actor: Actor, input: ListSavedJobsInput = {}) {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can list saved jobs')
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { userId: actor.userId, deletedAt: null },
      select: { id: true },
    })
    if (!candidate) throw new NotFoundException('Candidate profile not found')

    const { page, limit, skip, take } = resolvePagination(input.page, input.limit)

    const [rows, total] = await Promise.all([
      this.prisma.savedJob.findMany({
        where: { candidateId: candidate.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          job: {
            include: {
              tenant: { select: tenantSnippetSelect },
            },
          },
        },
      }),
      this.prisma.savedJob.count({ where: { candidateId: candidate.id } }),
    ])

    const items = rows.map((row) => {
      const { tenant, ...job } = row.job
      return { savedAt: row.createdAt, job, tenant }
    })

    return { items, total, page, limit }
  }
}
