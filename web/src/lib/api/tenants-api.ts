import { apiRequest } from '@/lib/api/client'
import type {
  PublicTenantBrandingResponse,
  TenantRecruiterItem,
  TenantResponse,
  TenantSnippet,
} from '@/lib/api/types'

/** Público — resolve slug → dados mínimos (id para rotas /carreiras/:tenantId). */
export function getTenantBySlug(slug: string) {
  const s = slug.trim()
  return apiRequest<TenantSnippet>(`/tenants/public/by-slug/${encodeURIComponent(s)}`, {
    method: 'GET',
  })
}

export function getPublicBranding(tenantId: string) {
  return apiRequest<PublicTenantBrandingResponse>(`/tenants/${tenantId}/branding`, {
    method: 'GET',
  })
}

export function getCurrentTenant(token: string) {
  return apiRequest<TenantResponse>('/tenants/current', { method: 'GET', token })
}

export function getCurrentTenantRecruiters(token: string) {
  return apiRequest<TenantRecruiterItem[]>('/tenants/current/recruiters', {
    method: 'GET',
    token,
  })
}

export function removeCurrentTenantRecruiter(token: string, userId: string) {
  return apiRequest<void>(`/tenants/current/recruiters/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    token,
  })
}

export function patchCurrentBranding(
  token: string,
  body: { logoKey?: string; bannerKey?: string },
) {
  return apiRequest<TenantResponse>('/tenants/current/branding', {
    method: 'PATCH',
    token,
    json: body,
  })
}

export function listPlatformTenants(token: string) {
  return apiRequest<TenantResponse[]>('/tenants', { method: 'GET', token })
}

export function createTenant(
  token: string,
  body: { name: string; slug: string; isActive?: boolean },
) {
  return apiRequest<TenantResponse>('/tenants', {
    method: 'POST',
    token,
    json: body,
  })
}

export function suspendTenant(token: string, id: string) {
  return apiRequest<TenantResponse>(`/tenants/${id}/suspend`, {
    method: 'PATCH',
    token,
  })
}

export function activateTenant(token: string, id: string) {
  return apiRequest<TenantResponse>(`/tenants/${id}/activate`, {
    method: 'PATCH',
    token,
  })
}

export function softDeleteTenant(token: string, id: string) {
  return apiRequest<TenantResponse>(`/tenants/${id}/delete`, {
    method: 'PATCH',
    token,
  })
}
