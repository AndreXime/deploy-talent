'use client'

import {
  Bookmark,
  Briefcase,
  Building2,
  ClipboardList,
  Compass,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

const candidateAreaLinks = [
  { href: '/candidato', label: 'Candidaturas', icon: ClipboardList },
  { href: '/candidato/guardadas', label: 'Guardadas', icon: Bookmark },
  { href: '/candidato/perfil', label: 'Perfil', icon: UserRound },
] as const

function isCandidateAreaLinkActive(pathname: string, href: string): boolean {
  if (href === '/candidato') {
    return pathname === '/candidato' || pathname.startsWith('/candidato/candidaturas')
  }
  return pathname.startsWith(href)
}

export function PublicHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { claims, signOut } = useAuth()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 lg:min-h-14 lg:gap-3 lg:px-6 lg:py-0">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <Briefcase className="size-7 text-muted-foreground" aria-hidden />
          Deploy Talent
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 lg:shrink-0">
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href="/vagas">
              <Compass className="size-4" aria-hidden />
              Explorar vagas
            </Link>
          </Button>
          {!claims ? (
            <>
              <Button variant="ghost" className="gap-2" asChild>
                <Link href="/entrar">
                  <LogIn className="size-4" aria-hidden />
                  Entrar
                </Link>
              </Button>
              <Button className="gap-2" asChild>
                <Link href="/registo">
                  <UserPlus className="size-4" aria-hidden />
                  Criar conta
                </Link>
              </Button>
            </>
          ) : (
            <>
              {claims.role === 'CANDIDATE' &&
                candidateAreaLinks.map(({ href, label, icon: Icon }) => {
                  const active = isCandidateAreaLinkActive(pathname, href)
                  return (
                    <Button
                      key={href}
                      variant={active ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <Link href={href}>
                        <Icon className="size-4" aria-hidden />
                        {label}
                      </Link>
                    </Button>
                  )
                })}
              {(claims.role === 'TENANT_ADMIN' || claims.role === 'RECRUITER') && (
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link href={homePathForRole(claims.role)}>
                    <Building2 className="size-4" aria-hidden />
                    Empresa
                  </Link>
                </Button>
              )}
              {claims.role === 'SUPER_ADMIN' && (
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link href="/plataforma/empresas">
                    <ShieldCheck className="size-4" aria-hidden />
                    Plataforma
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => {
                  signOut()
                  router.replace('/')
                }}
              >
                <LogOut className="size-4" aria-hidden />
                Sair
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
