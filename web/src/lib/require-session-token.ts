export function requireSessionToken(token: string | null): string {
  if (token === null || token === '') {
    throw new Error('Sessão necessária.')
  }
  return token
}
