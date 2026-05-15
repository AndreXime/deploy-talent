'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getAuthSession, logoutRequest } from '@/lib/api/auth-api'
import { subscribeUnauthorized } from '@/lib/api/client'
import type { JwtClaims } from '@/lib/auth-token'

const LEGACY_ACCESS_KEY = 'deploy_talent_access_token'
const LEGACY_REFRESH_KEY = 'deploy_talent_refresh_token'

interface AuthContextValue {
  /** Evita redirects antes da primeira leitura de sessão (`GET /auth/session`). */
  hydrated: boolean
  claims: JwtClaims | null
  setSessionClaims: (claims: JwtClaims | null) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [hydrated, setHydrated] = useState(false)
  const [claims, setClaims] = useState<JwtClaims | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(LEGACY_ACCESS_KEY)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await getAuthSession()
        if (cancelled) return
        if (
          data.authenticated &&
          typeof data.sub === 'string' &&
          typeof data.role === 'string' &&
          data.sub.length > 0 &&
          data.role.length > 0
        ) {
          const tenantRaw = data.tenantId
          const tenantId = tenantRaw === null || tenantRaw === undefined ? null : String(tenantRaw)
          setClaims({ sub: data.sub, role: data.role, tenantId })
        } else {
          setClaims(null)
        }
      } catch {
        if (!cancelled) setClaims(null)
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setSessionClaims = useCallback((next: JwtClaims | null) => {
    setClaims(next)
  }, [])

  const signOut = useCallback(() => {
    void (async () => {
      await logoutRequest().catch(() => {
        /* ignora erro de rede / 401 */
      })
      setClaims(null)
      window.location.href = '/entrar'
    })()
  }, [])

  useEffect(() => {
    const unsub = subscribeUnauthorized(() => {
      setClaims(null)
      window.location.href = '/entrar'
    })
    return unsub
  }, [])

  const value = useMemo(
    (): AuthContextValue => ({
      hydrated,
      claims,
      setSessionClaims,
      signOut,
    }),
    [hydrated, claims, setSessionClaims, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
