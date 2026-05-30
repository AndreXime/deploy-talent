import { createHash, randomBytes } from 'node:crypto'

/**
 * Gera um token opaco de 32 bytes em base64url. O valor cru segue por email;
 * em banco de dados só armazenamos o `tokenHash` (sha 256, hex).
 */
export function generateInvitationToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  return { raw, hash: hashInvitationToken(raw) }
}

export function hashInvitationToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
