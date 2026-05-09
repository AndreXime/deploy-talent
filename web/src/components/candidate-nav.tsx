'use client'

import { ClipboardList, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/auth-provider'

const links = [
  { href: '/candidato', label: 'Candidaturas', icon: ClipboardList },
  { href: '/candidato/perfil', label: 'Perfil', icon: UserRound },
] as const

export function CandidateNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3 lg:gap-6 lg:px-8">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === '/candidato'
            ? pathname === '/candidato' || pathname.startsWith('/candidato/candidaturas')
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
        className="ml-auto lg:ml-2"
        type="button"
        onClick={() => {
          signOut()
          router.replace('/')
        }}
      >
        Sair
      </Button>
    </div>
  )
}
