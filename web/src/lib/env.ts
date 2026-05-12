const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '')

if (!raw) {
  throw new Error(
    'NEXT_PUBLIC_API_BASE_URL é obrigatória. Define a variável em web/.env (ou no ambiente do build) antes de arrancar `next dev` ou `next build`.',
  )
}

export const API_BASE_URL: string = raw
