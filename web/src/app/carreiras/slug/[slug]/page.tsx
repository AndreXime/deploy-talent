'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PublicHeader } from '@/components/public-header'
import { getTenantBySlug } from '@/lib/api/tenants-api'

export default function CareerSlugRedirectPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params?.slug?.trim() ?? ''

  const q = useQuery({
    enabled: Boolean(slug),
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
      <main className="page-container flex flex-1 flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
        {!slug ? (
          <p>Slug inválido.</p>
        ) : q.isLoading ? (
          <p>A abrir página da empresa…</p>
        ) : q.isError ? (
          <p>Empresa não encontrada ou inativa. Verifique o link.</p>
        ) : (
          <p>A redirecionar…</p>
        )}
      </main>
    </div>
  )
}
