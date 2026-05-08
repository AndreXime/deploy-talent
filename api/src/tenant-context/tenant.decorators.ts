import { SetMetadata } from '@nestjs/common'

export const IS_TENANT_REQUIRED = 'isTenantRequired'

export function TenantRequired() {
  return SetMetadata(IS_TENANT_REQUIRED, true)
}

export function TenantOptional() {
  return SetMetadata(IS_TENANT_REQUIRED, false)
}
