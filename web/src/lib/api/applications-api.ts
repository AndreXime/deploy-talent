import { apiRequest } from '@/lib/api/client'
import type {
  ApiApplicationStatus,
  ApplicationCandidateListItem,
  ApplicationResponse,
  ApplicationTenantListItem,
  CandidateProfileResponse,
  JobResponse,
  Paginated,
  SourceCandidateResult,
} from '@/lib/api/types'

export function applyToJob(tenantId: string, body: { jobId: string }) {
  return apiRequest<ApplicationResponse>(`/tenants/${tenantId}/applications/apply`, {
    method: 'POST',
    json: body,
  })
}

export function listMyApplications(query?: {
  page?: number
  limit?: number
  status?: ApiApplicationStatus
}) {
  return apiRequest<Paginated<ApplicationCandidateListItem>>('/applications/me', {
    method: 'GET',
    query: query as Record<string, string | number | undefined>,
  })
}

export function getMyApplication(applicationId: string) {
  return apiRequest<ApplicationCandidateListItem>(`/applications/me/${applicationId}`, {
    method: 'GET',
  })
}

export function withdrawMyApplication(applicationId: string) {
  return apiRequest<ApplicationResponse>(`/applications/me/${applicationId}/withdraw`, {
    method: 'POST',
  })
}

export function listTenantApplications(query?: {
  page?: number
  limit?: number
  status?: ApiApplicationStatus
  jobId?: string
}) {
  return apiRequest<Paginated<ApplicationTenantListItem>>('/applications', {
    method: 'GET',
    query: query as Record<string, string | number | undefined>,
  })
}

export function getTenantApplication(id: string) {
  return apiRequest<ApplicationTenantDetail>(`/applications/${id}`, {
    method: 'GET',
  })
}

/** Resposta do Prisma com relações (alinhada ao use case). */
export interface ApplicationTenantDetail extends ApplicationResponse {
  candidate: CandidateProfileResponse
  job: JobResponse
}

export function moveApplication(id: string, body: { status: ApiApplicationStatus }) {
  return apiRequest<ApplicationResponse>(`/applications/${id}/move`, {
    method: 'PATCH',
    json: body,
  })
}

export function sourceCandidate(body: {
  jobId: string
  candidateEmail: string
  candidateName: string
}) {
  return apiRequest<SourceCandidateResult>('/applications/sourced', {
    method: 'POST',
    json: body,
  })
}
