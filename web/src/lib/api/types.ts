export type ApiJobStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED'

export type ApiApplicationStatus =
  | 'SOURCED'
  | 'APPLIED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'HIRED'

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface AccessTokenResponse {
  access_token: string
}

export interface TenantResponse {
  id: string
  name: string
  slug: string
  isActive: boolean
  deletedAt: string | null
  logoKey: string | null
  bannerKey: string | null
  createdAt: string
  updatedAt: string
}

export interface TenantSnippet {
  id: string
  name: string
  slug: string
  logoKey: string | null
  bannerKey: string | null
}

export interface JobResponse {
  id: string
  tenantId: string
  title: string
  description: string
  modality: string
  location: string
  seniority: string
  status: ApiJobStatus
  createdAt: string
  updatedAt: string
}

/** Linha de GET /jobs/public — vaga + empresa. */
export interface PublicJobWithTenantRow {
  job: JobResponse
  tenant: TenantSnippet
}

export interface MarketplaceTenantFilterOption {
  id: string
  name: string
}

/** GET /jobs/public/filters — facetas alinhadas ao listado do marketplace. */
export interface MarketplaceJobFilterOptions {
  modalities: string[]
  locations: string[]
  seniorities: string[]
  tenants: MarketplaceTenantFilterOption[]
}

/** Uma vaga guardada (GET /candidates/me/saved-jobs, POST idempotente). */
export interface CandidateSavedJobRow {
  savedAt: string
  job: JobResponse
  tenant: TenantSnippet
}

export interface CandidateProfileResponse {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  resumeUrl: string | null
  avatarKey: string | null
  deletedAt: string | null
  anonymizedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationResponse {
  id: string
  tenantId: string
  jobId: string
  candidateId: string
  status: ApiApplicationStatus
  stage: string | null
  sourcedByUserId: string | null
  appliedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationCandidateListItem extends ApplicationResponse {
  job: JobResponse
  tenant: TenantSnippet
}

export interface ApplicationTenantListItem extends ApplicationResponse {
  candidate: CandidateProfileResponse
  job: JobResponse
}

export interface EvaluationResponse {
  id: string
  tenantId: string
  applicationId: string
  createdByUserId: string | null
  score: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PresignedUrlResponse {
  url: string
  key: string
  expiresAt: string
  expiresInSeconds: number
}

export interface PublicBrandingAsset {
  url: string
  expiresAt: string
}

export interface PublicTenantBrandingResponse {
  logo: PublicBrandingAsset | null
  banner: PublicBrandingAsset | null
}

export interface ProvisionedUserResponse {
  id: string
  email: string
  tenantId: string | null
  role: string
}

export interface ApiErrorBody {
  statusCode: number
  error: string
  message: string
  path: string
  timestamp: string
}
