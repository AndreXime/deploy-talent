import { apiRequest } from '@/lib/api/client'
import type {
  ApiApplicationStatus,
  ApplicationCandidateListItem,
  ApplicationResponse,
  ApplicationTenantListItem,
  CandidateProfileResponse,
  EvaluationResponse,
  JobResponse,
  Paginated,
  SourceCandidateResult,
} from '@/lib/api/types'

export function applyToJob(token: string, tenantId: string, body: { jobId: string }) {
  return apiRequest<ApplicationResponse>(`/tenants/${tenantId}/applications/apply`, {
    method: 'POST',
    token,
    json: body,
  })
}

export function listMyApplications(
  token: string,
  query?: { page?: number; limit?: number; status?: ApiApplicationStatus },
) {
  return apiRequest<Paginated<ApplicationCandidateListItem>>('/applications/me', {
    method: 'GET',
    token,
    query: query as Record<string, string | number | undefined>,
  })
}

export function getMyApplication(token: string, applicationId: string) {
  return apiRequest<ApplicationCandidateListItem>(`/applications/me/${applicationId}`, {
    method: 'GET',
    token,
  })
}

export function withdrawMyApplication(token: string, applicationId: string) {
  return apiRequest<ApplicationResponse>(`/applications/me/${applicationId}/withdraw`, {
    method: 'POST',
    token,
  })
}

export function listTenantApplications(
  token: string,
  query?: {
    page?: number
    limit?: number
    status?: ApiApplicationStatus
    jobId?: string
  },
) {
  return apiRequest<Paginated<ApplicationTenantListItem>>('/applications', {
    method: 'GET',
    token,
    query: query as Record<string, string | number | undefined>,
  })
}

export function getTenantApplication(token: string, id: string) {
  return apiRequest<ApplicationTenantDetail>(`/applications/${id}`, {
    method: 'GET',
    token,
  })
}

/** Resposta do Prisma com relações (alinhada ao use case). */
export interface ApplicationTenantDetail extends ApplicationResponse {
  candidate: CandidateProfileResponse
  job: JobResponse
  evaluations: EvaluationResponse[]
}

export function moveApplication(
  token: string,
  id: string,
  body: { status: ApiApplicationStatus; stage?: string },
) {
  return apiRequest<ApplicationResponse>(`/applications/${id}/move`, {
    method: 'PATCH',
    token,
    json: body,
  })
}

export function sourceCandidate(
  token: string,
  body: {
    jobId: string
    candidateEmail: string
    candidateName: string
  },
) {
  return apiRequest<SourceCandidateResult>('/applications/sourced', {
    method: 'POST',
    token,
    json: body,
  })
}

export function listEvaluations(token: string, applicationId: string) {
  return apiRequest<EvaluationResponse[]>('/applications/evaluations', {
    method: 'GET',
    token,
    query: { applicationId },
  })
}

export function createEvaluation(
  token: string,
  body: {
    applicationId: string
    score?: number
    notes?: string
  },
) {
  return apiRequest<EvaluationResponse>('/applications/evaluations', {
    method: 'POST',
    token,
    json: body,
  })
}

export function getEvaluation(token: string, evaluationId: string) {
  return apiRequest<EvaluationResponse>(`/applications/evaluations/${evaluationId}`, {
    method: 'GET',
    token,
  })
}

export function patchEvaluation(
  token: string,
  evaluationId: string,
  body: { score?: number | null; notes?: string | null },
) {
  return apiRequest<EvaluationResponse>(`/applications/evaluations/${evaluationId}`, {
    method: 'PATCH',
    token,
    json: body,
  })
}
