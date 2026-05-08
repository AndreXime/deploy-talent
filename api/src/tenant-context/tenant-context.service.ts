import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable } from '@nestjs/common'

export interface TenantContextStore {
  tenantId: string
}

@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContextStore>()

  runWithTenant<T>(tenantId: string, fn: () => T): T {
    return this.als.run({ tenantId }, fn)
  }

  getTenantId(): string | null {
    return this.als.getStore()?.tenantId ?? null
  }

  requireTenantId(): string {
    const tenantId = this.getTenantId()
    if (tenantId === null) {
      throw new Error('Missing tenant in request context')
    }
    return tenantId
  }
}
