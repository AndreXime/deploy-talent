export interface JwtPayload {
  sub: string
  tenantId: string | null
  role: string
}
