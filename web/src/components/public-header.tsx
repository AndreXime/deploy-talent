'use client'

import {
  Bookmark,
  Briefcase,
  Building2,
  ClipboardList,
  Compass,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { homePathForRole } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-provider'

const candidateAreaLinks = [
  { href: '/candidato', label: 'Candidaturas', icon: ClipboardList },
  { href: '/candidato/salvas', label: 'Salvas', icon: Bookmark },
  { href: '/candidato/perfil', label: 'Perfil', icon: UserRound },
] as const

function isCandidateAreaLinkActive(pathname: string, href: string): boolean {
  if (href === '/candidato') {
    return pathname === '/candidato' || pathname.startsWith('/candidato/candidaturas')
  }
  return pathname.startsWith(href)
}

interface NavActionsProps {
  pathname: string
  stack: boolean
  onNavigate?: () => void
}

function NavActions({ pathname, stack, onNavigate }: NavActionsProps) {
  const router = useRouter()
  const { claims, signOut } = useAuth()

  const itemClass = stack ? 'w-full justify-start' : ''
  const gapClass = stack ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-2'

  return (
    <div className={cn(gapClass)}>
      <Button variant="ghost" size="sm" className={cn('gap-2', itemClass)} asChild>
        <Link href="/vagas" onClick={onNavigate}>
          <Compass className="size-4 shrink-0" aria-hidden />
          Explorar vagas
        </Link>
      </Button>

      {!claims ? (
        <>
          <Button variant="ghost" size="sm" className={cn('gap-2', itemClass)} asChild>
            <Link href="/entrar" onClick={onNavigate}>
              <LogIn className="size-4 shrink-0" aria-hidden />
              Entrar
            </Link>
          </Button>
          <Button size="sm" className={cn('gap-2', itemClass)} asChild>
            <Link href="/cadastro" onClick={onNavigate}>
              <UserPlus className="size-4 shrink-0" aria-hidden />
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
                  className={cn('gap-2', itemClass)}
                  asChild
                >
                  <Link href={href} onClick={onNavigate}>
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </Button>
              )
            })}
          {(claims.role === 'TENANT_ADMIN' || claims.role === 'RECRUITER') && (
            <Button variant="outline" size="sm" className={cn('gap-2', itemClass)} asChild>
              <Link href={homePathForRole(claims.role)} onClick={onNavigate}>
                <Building2 className="size-4 shrink-0" aria-hidden />
                Empresa
              </Link>
            </Button>
          )}
          {claims.role === 'SUPER_ADMIN' && (
            <Button variant="outline" size="sm" className={cn('gap-2', itemClass)} asChild>
              <Link href="/plataforma/empresas" onClick={onNavigate}>
                <ShieldCheck className="size-4 shrink-0" aria-hidden />
                Plataforma
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-2', itemClass)}
            type="button"
            onClick={() => {
              onNavigate?.()
              signOut()
              router.replace('/')
            }}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            Sair
          </Button>
        </>
      )}
    </div>
  )
}

export function PublicHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 lg:gap-4 lg:px-6">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <Briefcase className="size-7 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">Deploy Talent</span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex lg:shrink-0" aria-label="Principal">
          <NavActions pathname={pathname} stack={false} />
        </nav>

        <div className="flex shrink-0 lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
              aria-label="Abrir menu de navegação"
            >
              <Menu className="size-5" aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[min(100vw-1.5rem,20rem)] flex-col gap-0">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav
                className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-4 pt-2"
                aria-label="Principal"
              >
                <NavActions pathname={pathname} stack onNavigate={() => setMenuOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
