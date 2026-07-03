/** Nomes de tenant para seed (5 empresas reais, únicos entre si). */
export const SEED_TENANT_NAMES = [
  'PurpleBank',
  'UaiFood',
  'FeiraLivre',
  'BrickPagamentos',
  'NonoAndar',
] as const

/** Partes combináveis para títulos de vaga (PT-BR). */
const JOB_TITLE_DICTIONARY = {
  papel: [
    'Desenvolvedor(a)',
    'Engenheiro(a) de Software',
    'Engenheiro(a) de Dados',
    'Analista de Dados',
    'Cientista de Dados',
    'Tech Lead',
    'Engenheiro(a) DevOps',
    'SRE',
    'Engenheiro(a) de Segurança',
    'Arquiteto(a) de Software',
    'Engenheiro(a) de Machine Learning',
    'Designer(a) de Produto',
    'Product Manager',
  ],
  focoTecnico: [
    'Backend',
    'Frontend',
    'Mobile',
    'Full Stack',
    'Plataforma',
    'Infraestrutura',
    'Dados',
    'Observabilidade',
    'Pagamentos',
    'Contas e Transações',
    'Marketplace',
    'Logística',
    'Search & Discovery',
    'Experiência do Cliente',
  ],
  focoProduto: [
    'Growth',
    'Descoberta',
    'Onboarding',
    'Carteira',
    'Experiência do App',
    'CRM',
    'Search & Discovery',
    'Pagamentos',
  ],
} as const

const PRODUCT_SEED_PAPEIS = new Set<string>(['Product Manager', 'Designer(a) de Produto'])

export function buildSeedJobTitle(tenantIndex: number, jobIndex: number): string {
  const papel =
    JOB_TITLE_DICTIONARY.papel[(tenantIndex + jobIndex * 3) % JOB_TITLE_DICTIONARY.papel.length]
  if (PRODUCT_SEED_PAPEIS.has(papel)) {
    const foco =
      JOB_TITLE_DICTIONARY.focoProduto[
        (tenantIndex * 5 + jobIndex * 2) % JOB_TITLE_DICTIONARY.focoProduto.length
      ]
    return `${papel} — ${foco}`
  }
  const foco =
    JOB_TITLE_DICTIONARY.focoTecnico[
      (tenantIndex * 2 + jobIndex * 5) % JOB_TITLE_DICTIONARY.focoTecnico.length
    ]
  return `${papel} ${foco}`
}
