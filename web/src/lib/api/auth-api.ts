import { apiRequest } from '@/lib/api/client'
import type {
  AuthSessionStatusJson,
  B2BAccountResponse,
  SessionClaimsResponse,
} from '@/lib/api/types'

export function getAuthSession() {
  return apiRequest<AuthSessionStatusJson>('/auth/session', { method: 'GET' })
}

export function loginRequest(body: { email: string; password: string }) {
  return apiRequest<SessionClaimsResponse>('/auth/login', {
    method: 'POST',
    json: body,
  })
}

export function logoutRequest() {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    json: {},
  })
}

export interface RegisterTenantAdminResponse {
  status: 'pending_approval'
}

export function registerTenantAdminRequest(body: {
  companyName: string
  email: string
  password: string
}) {
  return apiRequest<RegisterTenantAdminResponse>('/auth/register/tenant-admin', {
    method: 'POST',
    json: body,
  })
}

export function registerCandidateRequest(body: { email: string; password: string; name: string }) {
  return apiRequest<SessionClaimsResponse>('/auth/register/candidate', {
    method: 'POST',
    json: body,
  })
}

export function getMyB2BAccount() {
  return apiRequest<B2BAccountResponse>('/auth/me', { method: 'GET' })
}

export function patchB2BAvatar(avatarKey: string) {
  return apiRequest<B2BAccountResponse>('/auth/me/avatar', {
    method: 'PATCH',
    json: { avatarKey },
  })
}
