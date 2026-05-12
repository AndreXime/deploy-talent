import { apiRequest } from '@/lib/api/client'
import type {
  AccessTokenResponse,
  B2BAccountResponse,
  ProvisionedUserResponse,
} from '@/lib/api/types'

export function loginRequest(body: { email: string; password: string }) {
  return apiRequest<AccessTokenResponse>('/auth/login', {
    method: 'POST',
    json: body,
  })
}

export function registerCandidateRequest(body: { email: string; password: string; name: string }) {
  return apiRequest<AccessTokenResponse>('/auth/register/candidate', {
    method: 'POST',
    json: body,
  })
}

export function createRecruiterRequest(token: string, body: { email: string; password: string }) {
  return apiRequest<ProvisionedUserResponse>('/auth/register/recruiter', {
    method: 'POST',
    token,
    json: body,
  })
}

export function getMyB2BAccount(token: string) {
  return apiRequest<B2BAccountResponse>('/auth/me', { method: 'GET', token })
}

export function patchB2BAvatar(token: string, avatarKey: string) {
  return apiRequest<B2BAccountResponse>('/auth/me/avatar', {
    method: 'PATCH',
    token,
    json: { avatarKey },
  })
}
