'use client'

import { ArrowRight, Building2, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PublicHeader } from '@/components/public-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiRequestError } from '@/lib/api/client'
import { getTenantBySlug } from '@/lib/api/tenants-api'
import { isTenantSlug } from '@/lib/is-tenant-slug'
import { isUuid } from '@/lib/is-uuid'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

export default function HomePage() {
  const { claims, token } = useAuth()
  const router = useRouter()
  const [tenantInput, setTenantInput] = useState('')
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (token && claims?.role) {
      router.replace(homePathForRole(claims.role))
    }
  }, [claims, router, token])

  if (token && claims?.role) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">A abrir…</div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 lg:flex-row lg:items-start lg:gap-14 lg:px-6 lg:py-24">
          <div className="flex-1 space-y-5">
            <p className="text-sm font-medium text-muted-foreground">
              Recrutamento claro para equipas e candidatos
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Candidate-se com um perfil único. A empresa gere o resto.
            </h1>
            <p className="max-w-xl text-pretty text-muted-foreground">
              Esta área está preparada para o dia a dia: navegação simples em telemóvel ou
              computador e linguagem humanizada em todo o lado.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button size="lg" asChild className="w-full gap-2 sm:w-auto">
                <Link href="/registo">
                  Sou candidato
                  <UserCircle className="size-5" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link href="/entrar" className="gap-2">
                  Já tenho conta
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
          <Card className="mx-auto w-full max-w-md shadow-sm lg:sticky lg:top-24 lg:mx-0">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-5" aria-hidden />
                <CardDescription>Vagas públicas por empresa</CardDescription>
              </div>
              <CardTitle className="text-lg">Ir às vagas da empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Introduza o <strong>slug</strong> (ex.: <code className="text-xs">acme-corp</code>)
                ou o UUID que a empresa partilhou.
              </p>
              <div className="space-y-2">
                <Label htmlFor="tenant-ref">Slug ou UUID</Label>
                <Input
                  id="tenant-ref"
                  placeholder="Ex.: acme-corp ou 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                  value={tenantInput}
                  onChange={(e) => setTenantInput(e.target.value.trim())}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <Button
                className="w-full"
                type="submit"
                disabled={resolving}
                onClick={async () => {
                  const t = tenantInput.trim()
                  if (!t) return
                  if (isUuid(t)) {
                    router.push(`/carreiras/${t}`)
                    return
                  }
                  if (!isTenantSlug(t)) {
                    toast.error('Use um slug (letras minúsculas e hífens) ou um UUID válido.')
                    return
                  }
                  setResolving(true)
                  try {
                    const tenant = await getTenantBySlug(t)
                    router.push(`/carreiras/${tenant.id}`)
                  } catch (err) {
                    if (err instanceof ApiRequestError) toast.error(err.message)
                    else toast.error('Não foi possível encontrar a empresa.')
                  } finally {
                    setResolving(false)
                  }
                }}
              >
                {resolving ? 'A resolver…' : 'Ver vagas'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Também pode{' '}
                <Link
                  href="/vagas"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  explorar todas as vagas
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
