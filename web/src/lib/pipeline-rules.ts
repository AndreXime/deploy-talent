import type { ApiApplicationStatus, ApiJobStatus } from '@/lib/api/types'

export function nextJobStatuses(from: ApiJobStatus): ApiJobStatus[] {
  switch (from) {
    case 'DRAFT':
      return ['PUBLISHED']
    case 'PUBLISHED':
      return ['PAUSED', 'CLOSED']
    case 'PAUSED':
      return ['PUBLISHED', 'CLOSED']
    case 'CLOSED':
      return []
    default:
      return []
  }
}

export function canPublishJob(fields: {
  title: string
  description: string
  modality: string
  location: string
  seniority: string
}): boolean {
  return (
    fields.title.trim().length > 0 &&
    fields.description.trim().length > 0 &&
    fields.modality.trim().length > 0 &&
    fields.location.trim().length > 0 &&
    fields.seniority.trim().length > 0
  )
}

export function nextApplicationStatuses(current: ApiApplicationStatus): ApiApplicationStatus[] {
  const terminal: ApiApplicationStatus[] = ['REJECTED', 'WITHDRAWN', 'HIRED']
  if (terminal.includes(current)) return []

  switch (current) {
    case 'SOURCED':
      return ['IN_PROGRESS', 'REJECTED']
    case 'APPLIED':
      return ['IN_PROGRESS', 'REJECTED']
    case 'IN_PROGRESS':
      return ['REJECTED', 'HIRED']
    default:
      return []
  }
}

/** Candidato pode desistir nestes estados (alinhado ao use case withdraw). */
export function candidateMayWithdraw(status: ApiApplicationStatus): boolean {
  return status === 'SOURCED' || status === 'APPLIED' || status === 'IN_PROGRESS'
}
