'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PublicHeader } from '@/components/public-header'
import { getTenantBySlug } from '@/lib/api/tenants-api'
import { getApiBaseUrl } from '@/lib/env'

export default function CareerSlugRedirectPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params?.slug?.trim() ?? ''
  const noApi = !getApiBaseUrl()

  const q = useQuery({
    enabled: Boolean(slug) && !noApi,
    queryKey: ['tenant-by-slug', slug],
    queryFn: () => getTenantBySlug(slug),
    retry: false,
  })

  useEffect(() => {
    if (!q.data) return
    router.replace(`/carreiras/${q.data.id}`)
  }, [q.data, router])

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-16 text-center text-sm text-muted-foreground">
        {!slug ? (
          <p>Slug inválido.</p>
        ) : noApi ? (
          <p>
            Defina <code className="text-xs">NEXT_PUBLIC_API_BASE_URL</code>.
          </p>
        ) : q.isLoading ? (
          <p>A abrir página da empresa…</p>
        ) : q.isError ? (
          <p>Empresa não encontrada ou inactiva. Verifique o link.</p>
        ) : (
          <p>A redirecionar…</p>
        )}
      </main>
    </div>
  )
}
