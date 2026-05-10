'use client'

import { Bookmark, Briefcase, ClipboardList, Compass, LogOut, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/auth-provider'

const links = [
  { href: '/vagas', label: 'Explorar', icon: Compass },
  { href: '/candidato', label: 'Candidaturas', icon: ClipboardList },
  { href: '/candidato/guardadas', label: 'Guardadas', icon: Bookmark },
  { href: '/candidato/perfil', label: 'Perfil', icon: UserRound },
] as const

export function CandidateNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link
          href="/candidato"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <Briefcase className="size-7 text-muted-foreground" aria-hidden />
          Deploy Talent
        </Link>
        <nav className="flex flex-wrap items-center gap-2 lg:gap-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/candidato'
                ? pathname === '/candidato' || pathname.startsWith('/candidato/candidaturas')
                : href === '/vagas'
                  ? pathname === '/vagas' || pathname.startsWith('/vagas/')
                  : pathname.startsWith(href)
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            type="button"
            onClick={() => {
              signOut()
              router.replace('/')
            }}
          >
            <LogOut className="size-4" aria-hidden />
            Sair
          </Button>
        </nav>
      </div>
    </header>
  )
}
