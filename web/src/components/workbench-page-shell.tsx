import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WorkbenchPageShellProps {
  children: ReactNode
  className?: string
}

export function WorkbenchPageShell({ children, className }: WorkbenchPageShellProps) {
  return <div className={cn('flex flex-1 flex-col gap-6 p-4 lg:p-8', className)}>{children}</div>
}
