'use client'

import { Briefcase, Building2, Menu, Palette, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-provider'

const baseLinks = [
  { href: '/empresa/vagas', label: 'Vagas', icon: Briefcase },
  { href: '/empresa/candidaturas', label: 'Candidaturas', icon: Users },
  { href: '/empresa/marca', label: 'Marca', icon: Palette },
  { href: '/empresa/conta', label: 'A minha conta', icon: Building2 },
] as const

function NavLinks({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname()
  const { claims } = useAuth()

  const links =
    claims?.role === 'TENANT_ADMIN'
      ? [
          ...baseLinks.slice(0, 3),
          { href: '/empresa/equipa', label: 'Equipa', icon: UserPlus } as const,
          ...baseLinks.slice(3),
        ]
      : baseLinks

  return (
    <nav className="flex flex-col gap-1 p-4 lg:p-2">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent',
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function CompanyShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex xl:w-64">
        <div className="border-b px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Área da empresa
          </p>
        </div>
        <ScrollArea className="flex-1">
          <NavLinks />
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            type="button"
            onClick={() => {
              signOut()
              router.replace('/')
            }}
          >
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon' }),
                'rounded-lg border border-input shadow-xs',
              )}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <NavLinks onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              signOut()
              router.replace('/')
            }}
          >
            Sair
          </Button>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
