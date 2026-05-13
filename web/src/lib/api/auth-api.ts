import { apiRequest } from '@/lib/api/client'
import type { B2BAccountResponse, SessionTokensResponse } from '@/lib/api/types'

export function loginRequest(body: { email: string; password: string }) {
  return apiRequest<SessionTokensResponse>('/auth/login', {
    method: 'POST',
    json: body,
  })
}

export function logoutRequest(token: string, body?: { refresh_token?: string }) {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    token,
    json: body ?? {},
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
  return apiRequest<SessionTokensResponse>('/auth/register/candidate', {
    method: 'POST',
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
