import { BadRequestException } from '@nestjs/common'
import { PipelineStageKind } from '../../generated/prisma/client'

export type QuestionType = 'TEXT_SHORT' | 'TEXT_LONG' | 'SINGLE_CHOICE'

export interface QuestionnaireQuestion {
  id: string
  label: string
  type: QuestionType
  options?: string[]
  required: boolean
}

export interface QuestionnaireConfig {
  questions: QuestionnaireQuestion[]
}

export interface QuestionnaireAnswer {
  questionId: string
  value: string
}

export interface QuestionnaireSubmission {
  answers: QuestionnaireAnswer[]
}

export interface InterviewLinkConfig {
  instructions?: string
}

export interface InterviewLinkRecruiterPayload {
  url: string
  scheduledAt?: string
}

/** Apenas instruções; tipos MIME e tamanho máximo são fixos na API. */
export interface FileUploadConfig {
  instructions?: string
}

/** PDF, DOCX, PNG, JPEG, TXT (definido pela API, não configurável por etapa). */
export const PIPELINE_FILE_UPLOAD_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'text/plain',
] as const

/** Limite superior de tamanho por arquivo na pipeline (além do limite S3). */
export const PIPELINE_FILE_UPLOAD_MAX_BYTES_CAP = 10 * 1024 * 1024

export function resolvePipelineFileUploadMaxBytes(s3MaxUploadBytes: number): number {
  if (!Number.isFinite(s3MaxUploadBytes) || s3MaxUploadBytes <= 0) {
    return PIPELINE_FILE_UPLOAD_MAX_BYTES_CAP
  }
  return Math.min(s3MaxUploadBytes, PIPELINE_FILE_UPLOAD_MAX_BYTES_CAP)
}

export function assertPipelineStageFileContentType(contentType: string): void {
  const base = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
  const allowed = PIPELINE_FILE_UPLOAD_ALLOWED_MIME_TYPES as readonly string[]
  if (!allowed.includes(base)) {
    throw new BadRequestException(
      `contentType deve ser um dos tipos permitidos na pipeline: ${allowed.join(', ')}`,
    )
  }
}

export interface FileUploadSubmission {
  fileKey: string
  mimeType?: string
  sizeBytes?: number
}

const QUESTION_TYPES: ReadonlyArray<QuestionType> = ['TEXT_SHORT', 'TEXT_LONG', 'SINGLE_CHOICE']

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`Campo "${field}" deve ser texto não vazio`)
  }
  return value
}

function validateQuestionnaireConfig(raw: unknown): QuestionnaireConfig {
  if (!isObject(raw)) {
    throw new BadRequestException('Configuração do questionário deve ser um objeto')
  }
  const questions = raw.questions
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new BadRequestException('Questionário precisa de pelo menos uma pergunta')
  }
  const seenIds = new Set<string>()
  const validated: QuestionnaireQuestion[] = questions.map((q, idx) => {
    if (!isObject(q)) {
      throw new BadRequestException(`Pergunta ${idx + 1} inválida`)
    }
    const id = asNonEmptyString(q.id, `questions[${idx}].id`)
    if (seenIds.has(id)) {
      throw new BadRequestException(`Pergunta com id duplicado: "${id}"`)
    }
    seenIds.add(id)
    const label = asNonEmptyString(q.label, `questions[${idx}].label`)
    const type = q.type as QuestionType
    if (!QUESTION_TYPES.includes(type)) {
      throw new BadRequestException(
        `Tipo de pergunta inválido em questions[${idx}].type: "${String(q.type)}"`,
      )
    }
    const required = typeof q.required === 'boolean' ? q.required : true
    let options: string[] | undefined
    if (type === 'SINGLE_CHOICE') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new BadRequestException(
          `Pergunta SINGLE_CHOICE em questions[${idx}] precisa de pelo menos 2 opções`,
        )
      }
      options = q.options.map((opt, optIdx) =>
        asNonEmptyString(opt, `questions[${idx}].options[${optIdx}]`),
      )
    }
    return { id, label, type, options, required }
  })
  return { questions: validated }
}

function validateInterviewLinkConfig(raw: unknown): InterviewLinkConfig {
  if (raw === null || raw === undefined) return {}
  if (!isObject(raw)) {
    throw new BadRequestException('Configuração de entrevista deve ser um objeto')
  }
  const instructions = typeof raw.instructions === 'string' ? raw.instructions : undefined
  return { instructions }
}

function validateFileUploadConfig(raw: unknown): FileUploadConfig {
  if (raw === null || raw === undefined) return {}
  if (!isObject(raw)) {
    throw new BadRequestException('Configuração de upload deve ser um objeto')
  }
  const forbidden = Object.keys(raw).filter((k) => k !== 'instructions')
  if (forbidden.length > 0) {
    throw new BadRequestException(
      `FILE_UPLOAD: tipos e tamanho máximo são definidos pela API; remova os campos: ${forbidden.join(', ')}`,
    )
  }
  const instructions = typeof raw.instructions === 'string' ? raw.instructions : undefined
  return instructions !== undefined ? { instructions } : {}
}

/**
 * Valida e normaliza a configuração de uma etapa conforme o `kind`. Lança
 * `BadRequestException` em qualquer inconsistência.
 */
export function validateStageConfig(
  kind: PipelineStageKind,
  raw: unknown,
): Record<string, unknown> {
  switch (kind) {
    case PipelineStageKind.MANUAL:
      if (raw !== undefined && raw !== null && !isObject(raw)) {
        throw new BadRequestException('Etapa MANUAL não aceita configuração')
      }
      return {}
    case PipelineStageKind.QUESTIONNAIRE:
      return validateQuestionnaireConfig(raw) as unknown as Record<string, unknown>
    case PipelineStageKind.INTERVIEW_LINK:
      return validateInterviewLinkConfig(raw) as unknown as Record<string, unknown>
    case PipelineStageKind.FILE_UPLOAD:
      return validateFileUploadConfig(raw) as unknown as Record<string, unknown>
  }
}

/**
 * Valida a submissão do candidato para uma etapa, à luz da `config` da
 * mesma. Devolve o payload normalizado pronto para gravar em
 * `ApplicationStageProgress.submittedData`. Não aplicável a `MANUAL` (lança).
 */
export interface ValidateStageSubmissionOptions {
  /** Limite global S3 (`S3_MAX_UPLOAD_BYTES`); usado com `PIPELINE_FILE_UPLOAD_MAX_BYTES_CAP`. */
  s3MaxUploadBytes: number
}

export function validateStageSubmission(
  kind: PipelineStageKind,
  config: unknown,
  payload: unknown,
  options?: ValidateStageSubmissionOptions,
): Record<string, unknown> {
  switch (kind) {
    case PipelineStageKind.MANUAL:
      throw new BadRequestException('Etapa MANUAL não aceita submissão do candidato')
    case PipelineStageKind.INTERVIEW_LINK:
      throw new BadRequestException(
        'Etapa de entrevista é gerida pelo recrutador; candidato não submete',
      )
    case PipelineStageKind.QUESTIONNAIRE: {
      const cfg = validateQuestionnaireConfig(config)
      return validateQuestionnaireSubmission(cfg, payload) as unknown as Record<string, unknown>
    }
    case PipelineStageKind.FILE_UPLOAD: {
      const s3Max =
        options?.s3MaxUploadBytes ??
        (() => {
          const raw = process.env.S3_MAX_UPLOAD_BYTES
          if (raw === undefined || raw.trim() === '') return 10 * 1024 * 1024
          const n = Number.parseInt(raw, 10)
          return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024
        })()
      return validateFileUploadSubmission(payload, s3Max) as unknown as Record<string, unknown>
    }
  }
}

function validateQuestionnaireSubmission(
  cfg: QuestionnaireConfig,
  payload: unknown,
): QuestionnaireSubmission {
  if (!isObject(payload) || !Array.isArray(payload.answers)) {
    throw new BadRequestException('Submissão deve ser { answers: [...] }')
  }
  const byId = new Map(cfg.questions.map((q) => [q.id, q]))
  const seen = new Set<string>()
  const normalized: QuestionnaireAnswer[] = []
  for (const ans of payload.answers as unknown[]) {
    if (!isObject(ans)) throw new BadRequestException('Resposta inválida')
    const questionId = asNonEmptyString(ans.questionId, 'questionId')
    const question = byId.get(questionId)
    if (!question) {
      throw new BadRequestException(`Resposta para pergunta desconhecida: "${questionId}"`)
    }
    if (seen.has(questionId)) {
      throw new BadRequestException(`Resposta duplicada para "${questionId}"`)
    }
    seen.add(questionId)
    const value = typeof ans.value === 'string' ? ans.value : ''
    if (question.required && value.trim().length === 0) {
      throw new BadRequestException(`Resposta obrigatória em falta para "${question.label}"`)
    }
    if (
      question.type === 'SINGLE_CHOICE' &&
      value.length > 0 &&
      !(question.options ?? []).includes(value)
    ) {
      throw new BadRequestException(
        `Resposta "${value}" não está entre as opções de "${question.label}"`,
      )
    }
    normalized.push({ questionId, value })
  }
  for (const q of cfg.questions) {
    if (q.required && !seen.has(q.id)) {
      throw new BadRequestException(`Resposta obrigatória em falta para "${q.label}"`)
    }
  }
  return { answers: normalized }
}

function validateFileUploadSubmission(
  payload: unknown,
  s3MaxUploadBytes: number,
): FileUploadSubmission {
  if (!isObject(payload)) {
    throw new BadRequestException('Submissão deve ser um objeto')
  }
  const fileKey = asNonEmptyString(payload.fileKey, 'fileKey')
  const mimeRaw = typeof payload.mimeType === 'string' ? payload.mimeType.trim() : ''
  const baseMime = mimeRaw.split(';')[0]?.trim().toLowerCase() ?? ''
  const mimeType = baseMime.length > 0 ? baseMime : undefined
  const sizeBytes =
    typeof payload.fileSize === 'number'
      ? payload.fileSize
      : typeof payload.sizeBytes === 'number'
        ? payload.sizeBytes
        : undefined
  const allowed = PIPELINE_FILE_UPLOAD_ALLOWED_MIME_TYPES as readonly string[]
  if (!mimeType || !allowed.includes(mimeType)) {
    throw new BadRequestException(
      `Tipo de arquivo não permitido. Aceites na pipeline: PDF, DOCX, PNG, JPG, TXT (${allowed.join(', ')})`,
    )
  }
  const maxBytes = resolvePipelineFileUploadMaxBytes(s3MaxUploadBytes)
  if (sizeBytes !== undefined && sizeBytes > maxBytes) {
    throw new BadRequestException(
      `Arquivo excede o limite de ${maxBytes} bytes (limite efetivo da pipeline e do armazenamento)`,
    )
  }
  return { fileKey, mimeType, sizeBytes }
}

/**
 * Valida o payload do recrutador para uma etapa `INTERVIEW_LINK` (define ou
 * atualiza URL e horário da entrevista). Não é a submissão do candidato.
 */
export function validateInterviewLinkRecruiterPayload(raw: unknown): InterviewLinkRecruiterPayload {
  if (!isObject(raw)) {
    throw new BadRequestException('Payload deve ser um objeto')
  }
  const url = asNonEmptyString(raw.url, 'url')
  try {
    new URL(url)
  } catch {
    throw new BadRequestException('URL inválido')
  }
  let scheduledAt: string | undefined
  if (raw.scheduledAt !== undefined && raw.scheduledAt !== null) {
    if (typeof raw.scheduledAt !== 'string' || Number.isNaN(new Date(raw.scheduledAt).getTime())) {
      throw new BadRequestException('scheduledAt deve ser uma data ISO válida')
    }
    scheduledAt = raw.scheduledAt
  }
  return { url, scheduledAt }
}
