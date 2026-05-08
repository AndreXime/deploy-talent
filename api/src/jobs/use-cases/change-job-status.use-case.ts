import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { JobStatus, type PrismaClient } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

@Injectable()
export class ChangeJobStatusUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(jobId: string, next: JobStatus) {
    const tenantId = this.tenantContext.getTenantId()
    if (tenantId === null) throw new BadRequestException('Missing X-Tenant-ID header')

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    })
    if (!job) throw new NotFoundException('Job not found')

    if (!isValidJobTransition(job.status, next)) {
      throw new ForbiddenException(`Invalid job transition: ${job.status} -> ${next}`)
    }

    if (job.status === JobStatus.DRAFT && next === JobStatus.PUBLISHED) {
      const missing = getMissingPublishFields(job)
      if (missing.length > 0) {
        throw new BadRequestException(`Missing required fields to publish: ${missing.join(', ')}`)
      }
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: { status: next },
    })
  }
}

function isValidJobTransition(from: JobStatus, to: JobStatus): boolean {
  if (from === to) return true
  switch (from) {
    case JobStatus.DRAFT:
      return to === JobStatus.PUBLISHED
    case JobStatus.PUBLISHED:
      return to === JobStatus.PAUSED || to === JobStatus.CLOSED
    case JobStatus.PAUSED:
      return to === JobStatus.PUBLISHED || to === JobStatus.CLOSED
    case JobStatus.CLOSED:
      return false
  }
}

function getMissingPublishFields(job: {
  title: string
  description: string
  modality: string
  location: string
  seniority: string
}): string[] {
  const missing: string[] = []
  if (job.title.trim().length === 0) missing.push('title')
  if (job.description.trim().length === 0) missing.push('description')
  if (job.modality.trim().length === 0) missing.push('modality')
  if (job.location.trim().length === 0) missing.push('location')
  if (job.seniority.trim().length === 0) missing.push('seniority')
  return missing
}

