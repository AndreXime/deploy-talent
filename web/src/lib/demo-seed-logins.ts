/**
 * Credenciais de demonstração espelhando api/prisma/seed/mock-data.json (1 por role).
 * Senha compartilhada: campo `password` do JSON de seed.
 */
export const DEMO_SEED_PASSWORD = 'Seed123!' as const

export interface DemoLoginPreset {
  label: string
  email: string
}

export const DEMO_LOGIN_PRESETS: readonly DemoLoginPreset[] = [
  { label: 'Entrar como Admin', email: 'superadmin@seed.local' },
  { label: 'Entrar como Empresa', email: 'emp1-admin@seed.local' },
  { label: 'Entrar como Recrutador', email: 'emp1-rec1@seed.local' },
  { label: 'Entrar como Candidato', email: 'cand1@seed.local' },
] as const
