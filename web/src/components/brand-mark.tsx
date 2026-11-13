import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  size?: number
  priority?: boolean
}

export function BrandMark({ className, size = 32, priority = false }: BrandMarkProps) {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt=""
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      priority={priority}
      unoptimized
      aria-hidden
    />
  )
}
