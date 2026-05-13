import type { ApiErrorBody } from '@/lib/api/types'
import { clearSessionStorage, persistSession, readRefreshToken } from '@/lib/auth-token'
import { API_BASE_URL } from '@/lib/env'

const UNAUTH_EVENT = 'deploy-talent:unauthorized'

export function dispatchUnauthorized(): void {
  if (typeof window !== 'undefined') {
    clearSessionStorage()
    window.dispatchEvent(new Event(UNAUTH_EVENT))
  }
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const refresh = readRefreshToken()
  if (!refresh) return null
  try {
    const url = `${API_BASE_URL}/auth/refresh`
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { access_token?: unknown; refresh_token?: unknown }
    if (typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string') {
      return null
    }
    persistSession({ access_token: data.access_token, refresh_token: data.refresh_token })
    return data.access_token
  } catch {
    return null
  }
}

export function subscribeUnauthorized(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(UNAUTH_EVENT, handler)
  return () => window.removeEventListener(UNAUTH_EVENT, handler)
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.body = body
  }
}

function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as ApiErrorBody).message
    if (typeof m === 'string' && m.length > 0) return m
  }
  if (status === 401) return 'Sessão expirada ou credenciais inválidas.'
  if (status === 403) return 'Não tem permissão para esta ação.'
  if (status === 404) return 'Recurso não encontrado.'
  return 'Não foi possível concluir o pedido.'
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  token?: string | null
  /** Evita loop quando o refresh já foi tentado para este pedido. */
  skipRefreshRetry?: boolean
  /** Corpo JSON (object serializável) */
  json?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (options.query) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(options.query)) {
      if (v === undefined) continue
      params.set(k, String(v))
    }
    const q = params.toString()
    if (q) url += `?${q}`
  }

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  const { json, token, query: _q, skipRefreshRetry, ...rest } = options
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })

  if (res.status === 401 && token && !skipRefreshRetry && typeof window !== 'undefined') {
    const nextAccess = await tryRefreshAccessToken()
    if (nextAccess) {
      return apiRequest(path, { ...options, token: nextAccess, skipRefreshRetry: true })
    }
  }

  if (res.status === 401 && token) {
    dispatchUnauthorized()
  }

  const text = await res.text()
  let data: unknown = null
  if (text.length > 0) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    throw new ApiRequestError(res.status, data, errorMessage(res.status, data))
  }

  return data as T
}
