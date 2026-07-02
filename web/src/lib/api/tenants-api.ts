import { apiRequest } from '@/lib/api/client'
import type {
  PublicTenantBrandingResponse,
  TenantRecruiterItem,
  TenantResponse,
  TenantSnippet,
} from '@/lib/api/types'

/** Público: resolve slug para dados mínimos (id para rotas /carreiras/:tenantId). */
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

export function getCurrentTenant() {
  return apiRequest<TenantResponse>('/tenants/current', { method: 'GET' })
}

export function getCurrentTenantRecruiters() {
  return apiRequest<TenantRecruiterItem[]>('/tenants/current/recruiters', {
    method: 'GET',
  })
}

export function removeCurrentTenantRecruiter(userId: string) {
  return apiRequest<void>(`/tenants/current/recruiters/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

export function patchCurrentBranding(body: { logoKey?: string; bannerKey?: string }) {
  return apiRequest<TenantResponse>('/tenants/current/branding', {
    method: 'PATCH',
    json: body,
  })
}

export function listPlatformTenants() {
  return apiRequest<TenantResponse[]>('/tenants', { method: 'GET' })
}

export function createTenant(body: { name: string; slug: string; isActive?: boolean }) {
  return apiRequest<TenantResponse>('/tenants', {
    method: 'POST',
    json: body,
  })
}

export function suspendTenant(id: string) {
  return apiRequest<TenantResponse>(`/tenants/${id}/suspend`, {
    method: 'PATCH',
  })
}

export function activateTenant(id: string) {
  return apiRequest<TenantResponse>(`/tenants/${id}/activate`, {
    method: 'PATCH',
  })
}

export function softDeleteTenant(id: string) {
  return apiRequest<TenantResponse>(`/tenants/${encodeURIComponent(id)}/delete`, {
    method: 'PATCH',
  })
}

export function approveTenantSignup(id: string) {
  return apiRequest<TenantResponse>(`/tenants/${encodeURIComponent(id)}/approve-signup`, {
    method: 'PATCH',
  })
}

export function rejectTenantSignup(id: string) {
  return apiRequest<void>(`/tenants/${encodeURIComponent(id)}/reject-signup`, {
    method: 'PATCH',
  })
}
