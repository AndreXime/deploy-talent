export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL
  return typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : ''
}

export function careersHeadline(): string {
  const h = process.env.NEXT_PUBLIC_CAREERS_HEADLINE
  return typeof h === 'string' && h.trim().length > 0 ? h.trim() : 'Vagas abertas'
}
