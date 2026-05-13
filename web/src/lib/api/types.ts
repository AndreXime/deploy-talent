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
  /** URL GET pré-assinada (expira); ausente se não houver currículo. */
  resumeUrl: string | null
  /** URL GET pré-assinada (expira); ausente se não houver avatar. */
  avatarUrl: string | null
  deletedAt: string | null
  anonymizedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Campos aceites em `PATCH /candidates/me` (continuam a ser chaves S3 após upload). */
export type PatchCandidateProfileBody = Partial<{
  name: string
  phone: string
  resumeKey: string
  avatarKey: string
}>

export interface ApplicationResponse {
  id: string
  tenantId: string
  jobId: string
  candidateId: string
  status: ApiApplicationStatus
  currentJobStageId: string | null
  sourcedByUserId: string | null
  appliedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationCandidateListItem extends ApplicationResponse {
  job: JobResponse
  tenant: TenantSnippet
}

export interface ApplicationStageSummary {
  id: string
  name: string
  position: number
  kind: PipelineStageKind
}

export interface ApplicationTenantListItem extends ApplicationResponse {
  candidate: CandidateProfileResponse
  job: JobResponse
  currentStage: ApplicationStageSummary | null
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
  name: string
  logo: PublicBrandingAsset | null
  banner: PublicBrandingAsset | null
}

export interface TenantRecruiterItem {
  id: string
  email: string
  /** URL GET pré assinada (expira); ausente quando não há foto. */
  avatarUrl: string | null
  createdAt: string
}

export interface B2BAccountResponse {
  id: string
  email: string
  tenantId: string | null
  role: string
  /** URL GET pré assinada (expira); ausente se não houver foto. */
  avatarUrl: string | null
}

export interface CreatedInvitationResponse {
  id: string
  email: string
  role: string
  tenantId: string | null
  expiresAt: string
}

export interface InvitationPreviewResponse {
  email: string
  name: string | null
  role: string
  tenantName: string | null
  expiresAt: string
}

export type SourceCandidateOutcome = 'CANDIDATE_INVITED' | 'JOB_LINK_SENT' | 'ALREADY_APPLIED'

export interface SourceCandidateResult {
  outcome: SourceCandidateOutcome
  invitationId?: string
  applicationId?: string
}

export type PipelineStageKind = 'MANUAL' | 'QUESTIONNAIRE' | 'INTERVIEW_LINK' | 'FILE_UPLOAD'

export type ApplicationStageProgressStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED'

export interface QuestionnaireQuestion {
  id: string
  label: string
  type: 'TEXT_SHORT' | 'TEXT_LONG' | 'SINGLE_CHOICE'
  options?: string[]
  required: boolean
}

export interface QuestionnaireConfig {
  questions: QuestionnaireQuestion[]
}

export interface InterviewLinkConfig {
  instructions?: string
}

export interface FileUploadConfig {
  instructions?: string
}

export interface PipelineStageResponse {
  id: string
  position: number
  kind: PipelineStageKind
  name: string
  config: Record<string, unknown>
  required: boolean
}

export interface PipelineTemplateResponse {
  id: string
  name: string
  stages: PipelineStageResponse[]
}

export interface PipelineStageInput {
  kind: PipelineStageKind
  name: string
  config?: Record<string, unknown>
  required?: boolean
}

export interface ApplicationStageProgressResponse {
  id: string
  applicationId: string
  jobStageId: string
  status: ApplicationStageProgressStatus
  submittedData: Record<string, unknown> | null
  completedAt: string | null
  completedByUserId: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationCurrentStageResponse {
  applicationId: string
  stage: PipelineStageResponse | null
  progress: ApplicationStageProgressResponse | null
}

export interface ApiErrorBody {
  statusCode: number
  error: string
  message: string
  path: string
  timestamp: string
}
