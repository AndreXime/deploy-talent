'use client'

import { useQuery } from '@tanstack/react-query'
import { Briefcase, Building2, ListChecks, Menu, Palette, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentTenant } from '@/lib/api/tenants-api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-provider'

const baseLinks = [
  { href: '/empresa/vagas', label: 'Vagas', icon: Briefcase },
  { href: '/empresa/candidaturas', label: 'Candidaturas', icon: Users },
  { href: '/empresa/pipeline', label: 'Pipeline', icon: ListChecks },
  { href: '/empresa/marca', label: 'Marca', icon: Palette },
  { href: '/empresa/conta', label: 'Minha conta', icon: Building2 },
] as const

function NavLinks({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname()
  const { claims } = useAuth()

  const links =
    claims?.role === 'TENANT_ADMIN'
      ? [
          ...baseLinks.slice(0, 4),
          { href: '/empresa/equipa', label: 'Equipe', icon: UserPlus } as const,
          ...baseLinks.slice(4),
        ]
      : baseLinks

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)]',
              active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Icon
              className={cn('size-4 shrink-0', active ? 'opacity-100' : 'opacity-70')}
              aria-hidden
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function CompanyHeading() {
  const { claims } = useAuth()
  const tenantQ = useQuery({
    enabled: !!claims,
    queryKey: ['company-shell-current-tenant', claims?.sub],
    queryFn: () => getCurrentTenant(),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
        Área da empresa
      </p>
      {tenantQ.isLoading ? (
        <Skeleton className="mt-1 h-6 w-36" />
      ) : (
        <p
          className="truncate font-display text-lg font-semibold tracking-tight text-sidebar-foreground"
          title={tenantQ.data?.name}
        >
          {tenantQ.data?.name ?? 'Empresa'}
        </p>
      )}
    </div>
  )
}

export function CompanyShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-full flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:h-dvh xl:w-64">
        <div className="border-b border-sidebar-border px-4 py-5">
          <CompanyHeading />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <NavLinks />
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full min-h-11"
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

      <div className="flex min-h-full min-w-0 flex-1 flex-col lg:h-dvh lg:min-h-0 lg:overflow-y-auto">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon' }),
                'min-h-11 min-w-11 rounded-lg',
              )}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-sidebar-border p-4 text-left">
                <SheetTitle className="sr-only">Menu da empresa</SheetTitle>
                <CompanyHeading />
              </SheetHeader>
              <NavLinks onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
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
