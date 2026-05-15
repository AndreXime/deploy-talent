import type { ApiErrorBody } from '@/lib/api/types'
import { API_BASE_URL } from '@/lib/env'

const UNAUTH_EVENT = 'deploy-talent:unauthorized'

function normalizedPath(path: string): string {
  const u = path.startsWith('/') ? path : `/${path}`
  const q = u.indexOf('?')
  return q === -1 ? u : u.slice(0, q)
}

function attemptRefreshOn401(path: string): boolean {
  const p = normalizedPath(path)
  const skip = [
    '/auth/login',
    '/auth/register/candidate',
    '/auth/register/tenant-admin',
    '/auth/refresh',
    '/auth/session/cookies',
  ]
  return !skip.some((prefix) => p === prefix)
}

/** 401 em fluxos de login/registo não devem limpar cookies nem disparar redirect. */
function shouldDispatchUnauthorized(path: string): boolean {
  const p = normalizedPath(path)
  const skip = [
    '/auth/login',
    '/auth/register/candidate',
    '/auth/register/tenant-admin',
    '/auth/refresh',
    '/auth/session/cookies',
  ]
  return !skip.some((prefix) => p === prefix)
}

export function dispatchUnauthorized(): void {
  if (typeof window === 'undefined') return
  void (async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/session/cookies`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch {
      /* ignorar rede */
    }
    window.dispatchEvent(new Event(UNAUTH_EVENT))
  })()
}

async function tryRefreshViaCookies(): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/auth/refresh`
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    })
    return res.ok
  } catch {
    return false
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
  /** Evita loop quando o refresh já foi tentado para este pedido. */
  skipRefreshRetry?: boolean
  /** Corpo JSON (object serializável) */
  json?: unknown
  query?: Record<string, string | number | boolean | undefined>
  /** Bearer explícito (ex.: Swagger); com `undefined` usa apenas cookies httpOnly. */
  bearerToken?: string | null
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

  const {
    json,
    bearerToken,
    query: _q,
    skipRefreshRetry,
    credentials: credsFromOpts,
    ...rest
  } = options
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (typeof bearerToken === 'string' && bearerToken.length > 0) {
    headers.set('Authorization', `Bearer ${bearerToken}`)
  }

  const credentials = credsFromOpts ?? 'include'

  const res = await fetch(url, {
    ...rest,
    credentials,
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })

  if (res.status === 401 && !skipRefreshRetry && typeof window !== 'undefined') {
    if (attemptRefreshOn401(path)) {
      const ok = await tryRefreshViaCookies()
      if (ok) {
        return apiRequest(path, { ...options, skipRefreshRetry: true })
      }
    }
    if (shouldDispatchUnauthorized(path)) {
      dispatchUnauthorized()
    }
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
