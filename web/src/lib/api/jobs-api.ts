import { apiRequest } from '@/lib/api/client'
import type {
  ApiJobStatus,
  JobResponse,
  MarketplaceJobFilterOptions,
  Paginated,
  PublicJobWithTenantRow,
} from '@/lib/api/types'

export type PublicJobListFilters = {
  page?: number
  limit?: number
  q?: string
  modality?: string
  location?: string
  seniority?: string
}

export type MarketplaceJobListQuery = PublicJobListFilters & {
  tenantId?: string
}

export type PaginatedPublicExplore = Paginated<PublicJobWithTenantRow>

export function listTenantJobs(
  token: string,
  query?: { page?: number; limit?: number; status?: ApiJobStatus },
) {
  return apiRequest<Paginated<JobResponse>>('/jobs', {
    method: 'GET',
    token,
    query: query as Record<string, string | number | undefined>,
  })
}

export function createJob(
  token: string,
  body: {
    title: string
    description: string
    modality: string
    location: string
    seniority: string
    status?: ApiJobStatus
  },
) {
  return apiRequest<JobResponse>('/jobs', {
    method: 'POST',
    token,
    json: body,
  })
}

export function getTenantJob(token: string, id: string) {
  return apiRequest<JobResponse>(`/jobs/${id}`, {
    method: 'GET',
    token,
  })
}

export function patchJob(
  token: string,
  id: string,
  body: Partial<Pick<JobResponse, 'title' | 'description' | 'modality' | 'location' | 'seniority'>>,
) {
  return apiRequest<JobResponse>(`/jobs/${id}`, {
    method: 'PATCH',
    token,
    json: body,
  })
}

export function changeJobStatus(token: string, id: string, status: ApiJobStatus) {
  return apiRequest<JobResponse>(`/jobs/${id}/status`, {
    method: 'PATCH',
    token,
    json: { status },
  })
}

/** Público — sem token (career site; filtros q, modality, location, seniority). */
export function listPublicJobsForTenant(tenantId: string, query?: PublicJobListFilters) {
  return apiRequest<Paginated<JobResponse>>(`/tenants/${tenantId}/jobs`, {
    method: 'GET',
    query: query as Record<string, string | number | undefined>,
  })
}

/** Explorar vagas em toda a plataforma (GET /jobs/public). */
export function listMarketplaceJobs(query?: MarketplaceJobListQuery) {
  return apiRequest<PaginatedPublicExplore>('/jobs/public', {
    method: 'GET',
    query: query as Record<string, string | number | undefined>,
  })
}

/** Facetas para filtros do explorar (GET /jobs/public/filters). */
export function getMarketplaceJobFilterOptions() {
  return apiRequest<MarketplaceJobFilterOptions>('/jobs/public/filters', {
    method: 'GET',
  })
}

export function getPublicJob(tenantId: string, jobId: string) {
  return apiRequest<JobResponse>(`/tenants/${tenantId}/jobs/${jobId}`, {
    method: 'GET',
  })
}
