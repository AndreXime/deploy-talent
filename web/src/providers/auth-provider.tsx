'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { logoutRequest } from '@/lib/api/auth-api'
import { subscribeUnauthorized } from '@/lib/api/client'
import type { JwtClaims } from '@/lib/auth-token'
import {
  AUTH_REFRESH_STORAGE_KEY,
  AUTH_STORAGE_KEY,
  clearSessionStorage,
  parseJwtClaims,
  persistSession,
  type SessionTokens,
} from '@/lib/auth-token'

interface AuthContextValue {
  /** `true` após ler armazenamento local no cliente (evita redirects antes da sessão). */
  hydrated: boolean
  token: string | null
  claims: JwtClaims | null
  setSession: (session: SessionTokens | null) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [hydrated, setHydrated] = useState(false)
  const [token, setTokenState] = useState<string | null>(null)

  useEffect(() => {
    setTokenState(localStorage.getItem(AUTH_STORAGE_KEY))
    setHydrated(true)
  }, [])

  const setSession = useCallback((session: SessionTokens | null) => {
    if (!session) {
      clearSessionStorage()
      setTokenState(null)
      return
    }
    persistSession(session)
    setTokenState(session.access_token)
  }, [])

  const signOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      const access = localStorage.getItem(AUTH_STORAGE_KEY)
      const refresh = localStorage.getItem(AUTH_REFRESH_STORAGE_KEY)
      if (access) {
        const body = refresh ? { refresh_token: refresh } : {}
        void logoutRequest(access, body).catch(() => {})
      }
    }
    setSession(null)
  }, [setSession])

  useEffect(() => {
    const unsub = subscribeUnauthorized(() => {
      clearSessionStorage()
      setTokenState(null)
      window.location.href = '/entrar'
    })
    return unsub
  }, [])

  const claims = useMemo(() => parseJwtClaims(token), [token])

  const value = useMemo(
    (): AuthContextValue => ({
      hydrated,
      token,
      claims,
      setSession,
      signOut,
    }),
    [hydrated, token, claims, setSession, signOut],
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
