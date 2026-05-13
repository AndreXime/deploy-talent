export const JobStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
} as const

export const ApplicationStatus = {
  SOURCED: 'SOURCED',
  APPLIED: 'APPLIED',
  IN_PROGRESS: 'IN_PROGRESS',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  HIRED: 'HIRED',
} as const

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  RECRUITER: 'RECRUITER',
  CANDIDATE: 'CANDIDATE',
} as const

export const PipelineStageKind = {
  MANUAL: 'MANUAL',
  QUESTIONNAIRE: 'QUESTIONNAIRE',
  INTERVIEW_LINK: 'INTERVIEW_LINK',
  FILE_UPLOAD: 'FILE_UPLOAD',
} as const

export const ApplicationStageProgressStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
} as const

export type PrismaClient = Record<string, unknown>

export const Prisma = {
  defineExtension: (fn: unknown) => fn,
} as const
