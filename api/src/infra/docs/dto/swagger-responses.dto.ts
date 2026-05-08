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
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date
}

/** Snippet de empresa (ex.: candidato listando suas candidaturas). */
export class TenantSnippetDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty() slug!: string
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

/** Perfil global do candidato (`GET/PATCH/DELETE candidates/me`). */
export class CandidateProfileResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) userId!: string
  @ApiProperty() name!: string
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty({ nullable: true }) phone!: string | null
  @ApiProperty({ nullable: true }) resumeUrl!: string | null
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
  @ApiProperty({ enum: APPLICATION_STATUS_VALUES }) status!: (typeof APPLICATION_STATUS_VALUES)[number]
  @ApiProperty({ nullable: true }) stage!: string | null
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

/** Avaliação registrada pelo recrutador/admin. */
export class EvaluationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) tenantId!: string
  @ApiProperty({ format: 'uuid' }) applicationId!: string
  @ApiProperty({ nullable: true, format: 'uuid' }) createdByUserId!: string | null
  @ApiProperty({ nullable: true }) score!: number | null
  @ApiProperty({ nullable: true }) notes!: string | null
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date
}

/** Resposta dos endpoints que retornam session JWT (`access_token`). */
export class AccessTokenDto {
  @ApiProperty({
    description: 'JWT Bearer usado em `Authorization: Bearer <token>`',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIuLi4ifQ.signature',
  })
  access_token!: string
}

/** Usuário provisionado (`tenant-admin`, `recruiter`) sem devolver secrets. */
export class ProvisionedUserDto {
  @ApiProperty({ description: 'ID do usuário', format: 'uuid' })
  id!: string

  @ApiProperty({ description: 'E-mail cadastrado', format: 'email' })
  email!: string

  @ApiProperty({
    description: 'Tenant ao qual o usuário pertence; `SUPER_ADMIN` costuma não ter tenants',
    format: 'uuid',
    nullable: true,
    type: String,
    example: null,
  })
  tenantId!: string | null

  @ApiProperty({
    description: 'Papel da conta',
    enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'RECRUITER', 'CANDIDATE'],
  })
  role!: string
}
