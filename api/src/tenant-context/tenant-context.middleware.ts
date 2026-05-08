import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { TenantContextService } from './tenant-context.service'

function getTenantHeaderValue(req: Request): string | null {
  const value = req.header('x-tenant-id')
  if (value === undefined) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const tenantId = getTenantHeaderValue(req)
    if (tenantId === null) {
      next()
      return
    }

    this.tenantContext.runWithTenant(tenantId, next)
  }
}
