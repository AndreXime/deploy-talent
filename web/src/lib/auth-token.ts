export interface JwtClaims {
  sub: string
  role: string
  tenantId: string | null
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
    const parsed = JSON.parse(atob(base64)) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const sub = String((parsed as { sub?: unknown }).sub ?? '')
    const role = String((parsed as { role?: unknown }).role ?? '')
    const tenantIdRaw = (parsed as { tenantId?: unknown }).tenantId
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
