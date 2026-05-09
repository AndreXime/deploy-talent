import { JobStatus, type Prisma } from '../../../generated/prisma/client'

export interface PublicJobListingTextFilters {
  q?: string
  modality?: string
  location?: string
  seniority?: string
}

export function buildPublishedJobBaseWhere(
  filters: PublicJobListingTextFilters,
): Prisma.JobWhereInput {
  const clauses: Prisma.JobWhereInput[] = [
    { status: { in: [JobStatus.PUBLISHED, JobStatus.PAUSED] } },
  ]

  const trimmedQ = filters.q?.trim()
  if (trimmedQ) {
    clauses.push({
      OR: [
        { title: { contains: trimmedQ, mode: 'insensitive' } },
        { description: { contains: trimmedQ, mode: 'insensitive' } },
      ],
    })
  }

  const modality = filters.modality?.trim()
  if (modality) {
    clauses.push({ modality: { equals: modality, mode: 'insensitive' } })
  }

  const location = filters.location?.trim()
  if (location) {
    clauses.push({ location: { contains: location, mode: 'insensitive' } })
  }

  const seniority = filters.seniority?.trim()
  if (seniority) {
    clauses.push({ seniority: { equals: seniority, mode: 'insensitive' } })
  }

  return { AND: clauses }
}

export function buildMarketplaceJobsWhere(
  filters: PublicJobListingTextFilters & { tenantId?: string },
): Prisma.JobWhereInput {
  const clauses: Prisma.JobWhereInput[] = [
    buildPublishedJobBaseWhere(filters),
    { tenant: { isActive: true, deletedAt: null } },
  ]

  const tenantId = filters.tenantId?.trim()
  if (tenantId) {
    clauses.push({ tenantId })
  }

  return { AND: clauses }
}
