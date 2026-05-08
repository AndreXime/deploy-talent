import { TenantContextService } from './tenant-context.service'

describe('TenantContextService', () => {
  it('stores and retrieves tenant id inside context', () => {
    const svc = new TenantContextService()
    const value = svc.runWithTenant('t1', () => svc.getTenantId())
    expect(value).toBe('t1')
  })

  it('requireTenantId throws when missing', () => {
    const svc = new TenantContextService()
    expect(() => svc.requireTenantId()).toThrow('Missing tenant in request context')
  })
})

