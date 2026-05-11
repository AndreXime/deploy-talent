import type { ApiApplicationStatus, ApiJobStatus } from '@/lib/api/types'

/** Vocabulário do recrutador (ciclo de vida da vaga: ação que ele executa). */
const jobLabels: Record<ApiJobStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicada',
  PAUSED: 'Pausada',
  CLOSED: 'Encerrada',
}

/** Vocabulário do candidato (perspectiva externa: a vaga está disponível ou não). */
const jobPublicLabels: Record<ApiJobStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Em aberto',
  PAUSED: 'Pausada',
  CLOSED: 'Encerrada',
}

const applicationLabels: Record<ApiApplicationStatus, string> = {
  SOURCED: 'Contacto iniciado pela empresa',
  APPLIED: 'Candidatura enviada',
  IN_PROGRESS: 'Em avaliação',
  REJECTED: 'Encerrado (não selecionado)',
  WITHDRAWN: 'Desistiu',
  HIRED: 'Contratado',
}

export function jobStatusLabel(status: ApiJobStatus): string {
  return jobLabels[status] ?? status
}

export function jobStatusPublicLabel(status: ApiJobStatus): string {
  return jobPublicLabels[status] ?? status
}

export function applicationStatusLabel(status: ApiApplicationStatus): string {
  return applicationLabels[status] ?? status
}
