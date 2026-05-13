export const AUTH_STORAGE_KEY = 'deploy_talent_access_token'
export const AUTH_REFRESH_STORAGE_KEY = 'deploy_talent_refresh_token'

export interface JwtClaims {
  sub: string
  role: string
  tenantId: string | null
}

export interface SessionTokens {
  access_token: string
  refresh_token: string
}

export function parseJwtClaims(token: string | null): JwtClaims | null {
  if (!token?.includes('.')) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const middle = parts[1]
    const padded = middle.replace(/-/g, '+').replace(/_/g, '/')
    const padLen = (4 - (padded.length % 4)) % 4
    const base64 = padded + '='.repeat(padLen)
    const json = JSON.parse(atob(base64)) as unknown
    if (!json || typeof json !== 'object') return null
    const sub = String((json as { sub?: unknown }).sub ?? '')
    const role = String((json as { role?: unknown }).role ?? '')
    const tenantIdRaw = (json as { tenantId?: unknown }).tenantId
    const tenantId =
      tenantIdRaw === null || tenantIdRaw === undefined
        ? null
        : typeof tenantIdRaw === 'string'
          ? tenantIdRaw
          : null
    if (!sub || !role) return null
    return { sub, role, tenantId }
  } catch {
    return null
  }
}

export function persistSession(tokens: SessionTokens): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_STORAGE_KEY, tokens.access_token)
  localStorage.setItem(AUTH_REFRESH_STORAGE_KEY, tokens.refresh_token)
}

export function clearSessionStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(AUTH_REFRESH_STORAGE_KEY)
}

export function readRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_REFRESH_STORAGE_KEY)
}
