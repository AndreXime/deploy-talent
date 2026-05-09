import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '../../../generated/prisma/client'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import type { Actor } from '../../applications/use-cases/application.actor'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { buildMarketplaceJobsWhere } from '../../jobs/utils/public-job-listing-where'

const tenantSnippetSelect = {
  id: true,
  name: true,
  slug: true,
  logoKey: true,
  bannerKey: true,
} as const

function publicMarketplaceJobWhere(jobId: string): Prisma.JobWhereInput {
  return {
    AND: [buildMarketplaceJobsWhere({}), { id: jobId }],
  }
}

@Injectable()
export class SaveJobUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(actor: Actor, jobId: string) {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can save jobs')
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { userId: actor.userId, deletedAt: null },
      select: { id: true },
    })
    if (!candidate) throw new NotFoundException('Candidate profile not found')

    const existing = await this.prisma.savedJob.findUnique({
      where: {
        candidateId_jobId: { candidateId: candidate.id, jobId },
      },
      include: {
        job: {
          include: {
            tenant: { select: tenantSnippetSelect },
          },
        },
      },
    })

    if (existing) {
      const { tenant, ...jobRow } = existing.job
      return { savedAt: existing.createdAt, job: jobRow, tenant }
    }

    const job = await this.prisma.job.findFirst({
      where: publicMarketplaceJobWhere(jobId),
    })
    if (!job) throw new NotFoundException('Job not found or not publicly listed')

    const created = await this.prisma.savedJob.create({
      data: { candidateId: candidate.id, jobId },
      include: {
        job: {
          include: {
            tenant: { select: tenantSnippetSelect },
          },
        },
      },
    })

    const { tenant, ...jobRow } = created.job
    return { savedAt: created.createdAt, job: jobRow, tenant }
  }
}
