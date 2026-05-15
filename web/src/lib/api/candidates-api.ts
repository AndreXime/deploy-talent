import { apiRequest } from '@/lib/api/client'
import type {
  CandidateProfileResponse,
  CandidateSavedJobRow,
  Paginated,
  PatchCandidateProfileBody,
} from '@/lib/api/types'

export function getMyProfile() {
  return apiRequest<CandidateProfileResponse>('/candidates/me', {
    method: 'GET',
  })
}

export function patchMyProfile(body: PatchCandidateProfileBody) {
  return apiRequest<CandidateProfileResponse>('/candidates/me', {
    method: 'PATCH',
    json: body,
  })
}

export function forgetMe() {
  return apiRequest<CandidateProfileResponse>('/candidates/me', {
    method: 'DELETE',
  })
}

export function listMySavedJobs(query?: { page?: number; limit?: number }) {
  return apiRequest<Paginated<CandidateSavedJobRow>>('/candidates/me/saved-jobs', {
    method: 'GET',
    query: query as Record<string, number | undefined>,
  })
}

export function saveJobBookmark(jobId: string) {
  return apiRequest<CandidateSavedJobRow>('/candidates/me/saved-jobs', {
    method: 'POST',
    json: { jobId },
  })
}

export async function unsaveJob(jobId: string): Promise<void> {
  await apiRequest<unknown>(`/candidates/me/saved-jobs/${jobId}`, {
    method: 'DELETE',
  })
}
