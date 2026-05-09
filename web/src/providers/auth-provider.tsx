'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { subscribeUnauthorized } from '@/lib/api/client'
import type { JwtClaims } from '@/lib/auth-token'
import { AUTH_STORAGE_KEY, parseJwtClaims } from '@/lib/auth-token'

interface AuthContextValue {
  /** `true` após ler armazenamento local no cliente (evita redirects antes da sessão). */
  hydrated: boolean
  token: string | null
  claims: JwtClaims | null
  setSession: (token: string | null) => void
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

  const setSession = useCallback((t: string | null) => {
    setTokenState(t)
    if (t) {
      localStorage.setItem(AUTH_STORAGE_KEY, t)
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
  }, [setSession])

  useEffect(() => {
    const unsub = subscribeUnauthorized(() => {
      localStorage.removeItem(AUTH_STORAGE_KEY)
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
