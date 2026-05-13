import { createHash, randomBytes } from 'node:crypto'

export function generateOpaqueRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  const hash = hashRefreshToken(raw)
  return { raw, hash }
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
