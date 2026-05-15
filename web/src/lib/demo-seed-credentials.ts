/** Credenciais fixas do seed (`api/prisma/seed`); não importar mock-data.json no frontend. */
export const DEMO_SEED_PASSWORD = 'Seed123!' as const

export const DEMO_LOGIN_CREDENTIALS = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super administrador',
    email: 'superadmin@seed.local',
  },
  {
    role: 'TENANT_ADMIN',
    label: 'Administrador da empresa',
    email: 'emp1-admin@seed.local',
  },
  {
    role: 'RECRUITER',
    label: 'Recrutador',
    email: 'emp1-rec1@seed.local',
  },
  {
    role: 'CANDIDATE',
    label: 'Candidato',
    email: 'cand1@seed.local',
  },
] as const
