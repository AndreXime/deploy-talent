import { ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { PublicHeader } from '@/components/public-header'

interface AuthPageShellProps {
  children: ReactNode
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-background">
      <PublicHeader />
      <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
        <aside className="relative hidden min-h-0 flex-1 overflow-hidden lg:block">
          <Image
            src="/images/auth-office.jpg"
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(96.8%_0.006_85/0.92)_0%,oklch(96.8%_0.006_85/0.72)_38%,oklch(96.8%_0.006_85/0.28)_62%,transparent_82%)]"
            aria-hidden
          />
          <div className="relative flex h-full min-h-full flex-col justify-end p-10 xl:p-14">
            <div className="max-w-md pb-2">
              <p className="font-display text-4xl font-semibold leading-tight tracking-tight text-primary xl:text-5xl">
                Contratação de TI sem complicação.
              </p>
              <span className="mt-5 block h-1 w-16 rounded-full bg-primary" aria-hidden />
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 w-full flex-1 flex-col bg-card px-(--page-gutter) py-8 lg:py-10">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            {children}
          </div>
          <p className="mx-auto mt-8 flex max-w-md items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>Feito para equipes que contratam talento em TI.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
