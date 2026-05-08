import type { UserRole } from '../../../generated/prisma/client'

export interface Actor {
  userId: string
  role: UserRole
}

