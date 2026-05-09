'use client'

import { Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

export function PublicHeader() {
  const router = useRouter()
  const { claims, token, signOut } = useAuth()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 lg:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <Briefcase className="size-7 text-muted-foreground" aria-hidden />
          Deploy Talent
        </Link>
        <nav className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/vagas">Explorar vagas</Link>
          </Button>
          {!token ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/entrar">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/registo">Criar conta</Link>
              </Button>
            </>
          ) : (
            <>
              {claims?.role === 'CANDIDATE' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={homePathForRole('CANDIDATE')}>A minha área</Link>
                </Button>
              )}
              {(claims?.role === 'TENANT_ADMIN' || claims?.role === 'RECRUITER') && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={homePathForRole(claims.role)}>Empresa</Link>
                </Button>
              )}
              {claims?.role === 'SUPER_ADMIN' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/plataforma/empresas">Plataforma</Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut()
                  router.replace('/')
                }}
              >
                Sair
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
