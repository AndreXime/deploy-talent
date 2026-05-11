import { apiRequest } from '@/lib/api/client'
import type {
  CandidateProfileResponse,
  CandidateSavedJobRow,
  Paginated,
  PatchCandidateProfileBody,
} from '@/lib/api/types'

export function getMyProfile(token: string) {
  return apiRequest<CandidateProfileResponse>('/candidates/me', {
    method: 'GET',
    token,
  })
}

export function patchMyProfile(
  token: string,
  body: PatchCandidateProfileBody,
) {
  return apiRequest<CandidateProfileResponse>('/candidates/me', {
    method: 'PATCH',
    token,
    json: body,
  })
}

export function forgetMe(token: string) {
  return apiRequest<CandidateProfileResponse>('/candidates/me', {
    method: 'DELETE',
    token,
  })
}

export function listMySavedJobs(token: string, query?: { page?: number; limit?: number }) {
  return apiRequest<Paginated<CandidateSavedJobRow>>('/candidates/me/saved-jobs', {
    method: 'GET',
    token,
    query: query as Record<string, number | undefined>,
  })
}

export function saveJobBookmark(token: string, jobId: string) {
  return apiRequest<CandidateSavedJobRow>('/candidates/me/saved-jobs', {
    method: 'POST',
    token,
    json: { jobId },
  })
}

export async function unsaveJob(token: string, jobId: string): Promise<void> {
  await apiRequest<unknown>(`/candidates/me/saved-jobs/${jobId}`, {
    method: 'DELETE',
    token,
  })
}
