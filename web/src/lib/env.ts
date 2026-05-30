const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '')

if (!raw) {
  throw new Error(
    'NEXT_PUBLIC_API_BASE_URL é obrigatória. Defina a variável em web/.env (ou no ambiente do build) antes de iniciar `next dev` ou `next build`.',
  )
}

export const API_BASE_URL: string = raw

export const IS_DEMO = process.env.IS_DEMO === 'true'
