import { UnauthorizedException } from '@nestjs/common'
import type { Tenant, User } from '../../generated/prisma/client'
import { UserRole } from '../../generated/prisma/client'

export function assertB2bTenantAllowsLogin(user: User, tenant: Tenant | null): void {
  if (user.role !== UserRole.TENANT_ADMIN && user.role !== UserRole.RECRUITER) return

  if (!tenant || user.tenantId === null) {
    throw new UnauthorizedException('Conta sem empresa associada.')
  }
  if (tenant.deletedAt) {
    throw new UnauthorizedException('Empresa inactiva.')
  }
  if (tenant.signupPending) {
    throw new UnauthorizedException('Conta aguarda aprovação da plataforma.')
  }
  if (!tenant.isActive) {
    throw new UnauthorizedException('Empresa suspensa.')
  }
}
