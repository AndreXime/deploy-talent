export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL
  return typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : ''
}
