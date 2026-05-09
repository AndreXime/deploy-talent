import { apiRequest } from '@/lib/api/client'
import type { CandidateProfileResponse } from '@/lib/api/types'

export function getMyProfile(token: string) {
  return apiRequest<CandidateProfileResponse>('/candidates/me', {
    method: 'GET',
    token,
  })
}

export function patchMyProfile(
  token: string,
  body: Partial<Pick<CandidateProfileResponse, 'name' | 'phone' | 'resumeUrl' | 'avatarKey'>>,
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
