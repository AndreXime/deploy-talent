export type JwtTokenKind = 'access' | 'refresh'

export interface JwtPayload {
  sub: string
  tenantId: string | null
  role: string
  typ?: JwtTokenKind
}
