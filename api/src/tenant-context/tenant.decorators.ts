import { SetMetadata } from '@nestjs/common'
import { IS_TENANT_REQUIRED } from './tenant.guard'

export function TenantRequired() {
  return SetMetadata(IS_TENANT_REQUIRED, true)
}

export function TenantOptional() {
  return SetMetadata(IS_TENANT_REQUIRED, false)
}
