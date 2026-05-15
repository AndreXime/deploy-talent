'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

/** Envia utilizadores com sessão (cookie) para a área certa em vez da landing. */
export function HomeSessionRedirect() {
  const router = useRouter()
  const { hydrated, claims } = useAuth()

  useEffect(() => {
    if (!hydrated || !claims?.role) return
    router.replace(homePathForRole(claims.role))
  }, [claims, hydrated, router])

  return null
}
