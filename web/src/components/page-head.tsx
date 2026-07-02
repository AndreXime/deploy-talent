import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeadProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function PageHead({ title, description, children, className }: PageHeadProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-border/80 pb-6 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="min-w-0 section-head">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 flex-col gap-2">{children}</div> : null}
    </div>
  )
}
