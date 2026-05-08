import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { PrismaClient } from '../../generated/prisma/client'
import { PRISMA_CLIENT } from '../infra/prisma/prisma.constants'

export const IS_TENANT_REQUIRED = 'isTenantRequired'

export function getTenantIdFromHeader(req: Request): string | null {
  const value = req.header('x-tenant-id')
  if (value === undefined) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<boolean>(IS_TENANT_REQUIRED, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false

    const req = context.switchToHttp().getRequest<Request>()
    const tenantId = getTenantIdFromHeader(req)

    if (tenantId === null) {
      if (required) throw new ForbiddenException('Missing X-Tenant-ID header')
      return true
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null, isActive: true },
      select: { id: true },
    })

    if (!tenant) {
      throw new ForbiddenException('Invalid or inactive tenant')
    }

    return true
  }
}
