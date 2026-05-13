import { ApiProperty } from '@nestjs/swagger'

const JOB_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED'] as const
const APPLICATION_STATUS_VALUES = [
  'SOURCED',
  'APPLIED',
  'IN_PROGRESS',
  'REJECTED',
  'WITHDRAWN',
  'HIRED',
] as const

/** Tenant após create/list/suspend/activate/soft-delete. */
export class TenantResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty() slug!: string
  @ApiProperty() isActive!: boolean
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) deletedAt!: Date | null
  @ApiProperty({ nullable: true, description: 'Chave S3 do logo' }) logoKey!: string | null
  @ApiProperty({ nullable: true, description: 'Chave S3 do banner' }) bannerKey!: string | null
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date
}

/** Snippet de empresa (ex.: candidato listando suas candidaturas). */
export class TenantSnippetDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty() slug!: string
  @ApiProperty({ nullable: true, description: 'Chave S3 do logo' }) logoKey!: string | null
  @ApiProperty({ nullable: true, description: 'Chave S3 do banner' }) bannerKey!: string | null
}

/** Vaga no escopo do tenant. */
export class JobResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) tenantId!: string
  @ApiProperty() title!: string
  @ApiProperty() description!: string
  @ApiProperty() modality!: string
  @ApiProperty() location!: string
  @ApiProperty() seniority!: string
  @ApiProperty({ enum: JOB_STATUS_VALUES }) status!: (typeof JOB_STATUS_VALUES)[number]
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date
}

/** Linha do `GET /jobs/public`: vaga + empresa. */
export class PublicExploreJobRowDto {
  @ApiProperty({ type: JobResponseDto }) job!: JobResponseDto
  @ApiProperty({ type: TenantSnippetDto }) tenant!: TenantSnippetDto
}

/** Vaga guardada (`GET /candidates/me/saved-jobs`). */
export class CandidateSavedJobRowDto {
  @ApiProperty({ type: String, format: 'date-time' }) savedAt!: Date
  @ApiProperty({ type: JobResponseDto }) job!: JobResponseDto
  @ApiProperty({ type: TenantSnippetDto }) tenant!: TenantSnippetDto
}

/** Perfil global do candidato (`GET/PATCH/DELETE candidates/me`). */
export class CandidateProfileResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) userId!: string
  @ApiProperty() name!: string
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty({ nullable: true }) phone!: string | null
  @ApiProperty({
    nullable: true,
    description: 'URL GET assinada (S3) do currículo; ausente quando não há documento.',
  })
  resumeUrl!: string | null
  @ApiProperty({
    nullable: true,
    description: 'URL GET assinada (S3) do avatar; ausente quando não há foto.',
  })
  avatarUrl!: string | null
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) deletedAt!: Date | null
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) anonymizedAt!: Date | null
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date
}

/** Candidatura (`apply` / `sourced` / `move`). */
export class ApplicationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) tenantId!: string
  @ApiProperty({ format: 'uuid' }) jobId!: string
  @ApiProperty({ format: 'uuid' }) candidateId!: string
  @ApiProperty({ enum: APPLICATION_STATUS_VALUES })
  status!: (typeof APPLICATION_STATUS_VALUES)[number]
  @ApiProperty({ nullable: true, format: 'uuid' }) currentJobStageId!: string | null
  @ApiProperty({ nullable: true, format: 'uuid' }) sourcedByUserId!: string | null
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) appliedAt!: Date | null
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date
}

/** Lista B2B (`GET /applications`) com `include: { candidate, job }`. */
export class ApplicationTenantListItemDto extends ApplicationResponseDto {
  @ApiProperty({ type: CandidateProfileResponseDto }) candidate!: CandidateProfileResponseDto
  @ApiProperty({ type: JobResponseDto }) job!: JobResponseDto
}

/** Lista do candidato (`GET /applications/me`) com job + snippet do tenant. */
export class ApplicationCandidateListItemDto extends ApplicationResponseDto {
  @ApiProperty({ type: JobResponseDto }) job!: JobResponseDto
  @ApiProperty({ type: TenantSnippetDto }) tenant!: TenantSnippetDto
}

/** Resposta dos endpoints que retornam session JWT (`access_token`). */
export class AccessTokenDto {
  @ApiProperty({
    description: 'JWT Bearer usado em `Authorization: Bearer <token>`',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIuLi4ifQ.signature',
  })
  access_token!: string
}

/** Par access + refresh (login, registo, refresh, aceitar convite). */
export class SessionTokensDto extends AccessTokenDto {
  @ApiProperty({
    description:
      'Token opaco de refresh (persistido na base como hash; 24h por padrão). Enviar em `POST /auth/refresh` para obter novo par; o anterior deixa de ser válido.',
    example: 'base64url-opaco',
  })
  refresh_token!: string
}

/** Conta B2B do usuário autenticado (`GET /auth/me`, `PATCH /auth/me/avatar`). */
export class B2BAccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty({ nullable: true, format: 'uuid' }) tenantId!: string | null
  @ApiProperty({
    enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'RECRUITER', 'CANDIDATE'],
  })
  role!: string
  @ApiProperty({
    nullable: true,
    description: 'URL GET assinada (S3) do avatar; ausente quando não há foto.',
  })
  avatarUrl!: string | null
}

/** Recrutador listado na aba "Equipa" do tenant admin. */
export class TenantRecruiterItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty({
    nullable: true,
    description: 'URL GET assinada (S3) do avatar; ausente quando não há foto.',
  })
  avatarUrl!: string | null
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
}

/** Préviaização pública de um convite (sem expor o token nem o hash). */
export class InvitationPreviewDto {
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty({
    enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'RECRUITER', 'CANDIDATE'],
  })
  role!: string
  @ApiProperty({ nullable: true, description: 'Nome da empresa (quando aplicável)' })
  tenantName!: string | null
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date
}

/** Convite recém criado (devolvido ao SUPER_ADMIN após disparar o email). */
export class CreatedInvitationDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty({
    enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'RECRUITER', 'CANDIDATE'],
  })
  role!: string
  @ApiProperty({ nullable: true, format: 'uuid' }) tenantId!: string | null
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date
}

/**
 * Resultado do sourcing de candidato por um recrutador.
 *
 * - `CANDIDATE_INVITED`: email não estava registado; convite com link de
 *   ativação foi enviado e `invitationId` é devolvido.
 * - `JOB_LINK_SENT`: candidato já tem conta mas ainda não se candidatou; email
 *   apenas com o link público da vaga foi enviado.
 * - `ALREADY_APPLIED`: candidato já tem candidatura para esta vaga; nenhum
 *   email é enviado e `applicationId` aponta para a candidatura existente.
 */
export class SourceCandidateResultDto {
  @ApiProperty({ enum: ['CANDIDATE_INVITED', 'JOB_LINK_SENT', 'ALREADY_APPLIED'] })
  outcome!: 'CANDIDATE_INVITED' | 'JOB_LINK_SENT' | 'ALREADY_APPLIED'
  @ApiProperty({ required: false, format: 'uuid' }) invitationId?: string
  @ApiProperty({ required: false, format: 'uuid' }) applicationId?: string
}

/** Resposta de presign S3 (`StorageService`). */
export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'URL para PUT ou GET conforme operação' }) url!: string
  @ApiProperty({ description: 'Chave do objeto no bucket' }) key!: string
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date
  @ApiProperty() expiresInSeconds!: number
}

class PublicBrandingSignedAssetDto {
  @ApiProperty() url!: string
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date
}

/** Identidade pública da empresa (career site): nome + logo + banner. */
export class PublicTenantBrandingResponseDto {
  @ApiProperty() name!: string

  @ApiProperty({ nullable: true, type: PublicBrandingSignedAssetDto })
  logo!: PublicBrandingSignedAssetDto | null

  @ApiProperty({ nullable: true, type: PublicBrandingSignedAssetDto })
  banner!: PublicBrandingSignedAssetDto | null
}

export class PipelineStageResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() position!: number
  @ApiProperty({ enum: ['MANUAL', 'QUESTIONNAIRE', 'INTERVIEW_LINK', 'FILE_UPLOAD'] })
  kind!: 'MANUAL' | 'QUESTIONNAIRE' | 'INTERVIEW_LINK' | 'FILE_UPLOAD'
  @ApiProperty() name!: string
  @ApiProperty({
    description:
      'Configuração específica do kind. Para QUESTIONNAIRE: `{ questions: [...] }`. Para FILE_UPLOAD: apenas `{ instructions?: string }` (tipos PDF, DOCX, PNG, JPG, TXT e tamanho máximo são fixos na API). Para INTERVIEW_LINK: `{ instructions?: string }`. MANUAL é `{}`.',
  })
  config!: Record<string, unknown>
  @ApiProperty() required!: boolean
}

export class PipelineTemplateResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty({ type: [PipelineStageResponseDto] })
  stages!: PipelineStageResponseDto[]
}

export class ApplicationStageProgressResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) applicationId!: string
  @ApiProperty({ format: 'uuid' }) jobStageId!: string
  @ApiProperty({ enum: ['PENDING', 'COMPLETED', 'SKIPPED'] })
  status!: 'PENDING' | 'COMPLETED' | 'SKIPPED'
  @ApiProperty({ nullable: true, type: Object })
  submittedData!: Record<string, unknown> | null
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  completedAt!: Date | null
  @ApiProperty({ nullable: true, format: 'uuid' })
  completedByUserId!: string | null
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date
}

export class ApplicationCurrentStageResponseDto {
  @ApiProperty({ format: 'uuid' }) applicationId!: string
  @ApiProperty({ nullable: true, type: PipelineStageResponseDto })
  stage!: PipelineStageResponseDto | null
  @ApiProperty({ nullable: true, type: ApplicationStageProgressResponseDto })
  progress!: ApplicationStageProgressResponseDto | null
}
