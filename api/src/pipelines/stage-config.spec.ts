import { BadRequestException } from '@nestjs/common'
import { PipelineStageKind } from '../../generated/prisma/client'
import {
  assertPipelineStageFileContentType,
  validateInterviewLinkRecruiterPayload,
  validateStageConfig,
  validateStageSubmission,
} from './stage-config'

describe('validateStageConfig', () => {
  it('aceita MANUAL com objecto vazio', () => {
    expect(validateStageConfig(PipelineStageKind.MANUAL, undefined)).toEqual({})
    expect(validateStageConfig(PipelineStageKind.MANUAL, {})).toEqual({})
  })

  it('rejeita QUESTIONNAIRE sem perguntas', () => {
    expect(() => validateStageConfig(PipelineStageKind.QUESTIONNAIRE, { questions: [] })).toThrow(
      BadRequestException,
    )
  })

  it('rejeita SINGLE_CHOICE sem 2 opções', () => {
    expect(() =>
      validateStageConfig(PipelineStageKind.QUESTIONNAIRE, {
        questions: [
          { id: 'q1', label: 'Sim?', type: 'SINGLE_CHOICE', required: true, options: ['a'] },
        ],
      }),
    ).toThrow(BadRequestException)
  })

  it('aceita QUESTIONNAIRE válido', () => {
    const cfg = validateStageConfig(PipelineStageKind.QUESTIONNAIRE, {
      questions: [
        { id: 'q1', label: 'Nome', type: 'TEXT_SHORT', required: true },
        {
          id: 'q2',
          label: 'Senioridade',
          type: 'SINGLE_CHOICE',
          required: true,
          options: ['Junior', 'Senior'],
        },
      ],
    })
    expect((cfg as { questions: unknown[] }).questions).toHaveLength(2)
  })

  it('rejeita IDs duplicados no questionário', () => {
    expect(() =>
      validateStageConfig(PipelineStageKind.QUESTIONNAIRE, {
        questions: [
          { id: 'q1', label: 'A', type: 'TEXT_SHORT', required: true },
          { id: 'q1', label: 'B', type: 'TEXT_SHORT', required: true },
        ],
      }),
    ).toThrow(BadRequestException)
  })

  it('aceita INTERVIEW_LINK só com instructions opcional', () => {
    expect(validateStageConfig(PipelineStageKind.INTERVIEW_LINK, undefined)).toEqual({
      instructions: undefined,
    })
    expect(
      validateStageConfig(PipelineStageKind.INTERVIEW_LINK, { instructions: 'Vem com câmara' }),
    ).toEqual({ instructions: 'Vem com câmara' })
  })

  it('aceita FILE_UPLOAD só com instructions opcional', () => {
    expect(validateStageConfig(PipelineStageKind.FILE_UPLOAD, undefined)).toEqual({})
    expect(validateStageConfig(PipelineStageKind.FILE_UPLOAD, {})).toEqual({})
    expect(
      validateStageConfig(PipelineStageKind.FILE_UPLOAD, { instructions: 'Envie o portfolio' }),
    ).toEqual({ instructions: 'Envie o portfolio' })
  })

  it('rejeita FILE_UPLOAD com campos extra (tipos e tamanho são da API)', () => {
    expect(() =>
      validateStageConfig(PipelineStageKind.FILE_UPLOAD, {
        instructions: 'ok',
        acceptedMimeTypes: ['application/pdf'],
      }),
    ).toThrow(BadRequestException)
    expect(() => validateStageConfig(PipelineStageKind.FILE_UPLOAD, { maxBytes: 1000 })).toThrow(
      BadRequestException,
    )
  })
})

describe('assertPipelineStageFileContentType', () => {
  it('aceita PDF e DOCX', () => {
    expect(() => assertPipelineStageFileContentType('application/pdf')).not.toThrow()
    expect(() =>
      assertPipelineStageFileContentType(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).not.toThrow()
  })

  it('rejeita tipos não permitidos na pipeline', () => {
    expect(() => assertPipelineStageFileContentType('application/zip')).toThrow(BadRequestException)
  })
})

describe('validateStageSubmission', () => {
  it('rejeita submissão para MANUAL', () => {
    expect(() => validateStageSubmission(PipelineStageKind.MANUAL, {}, {})).toThrow(
      BadRequestException,
    )
  })

  it('rejeita submissão para INTERVIEW_LINK', () => {
    expect(() => validateStageSubmission(PipelineStageKind.INTERVIEW_LINK, {}, {})).toThrow(
      BadRequestException,
    )
  })

  it('valida questionário com resposta obrigatória', () => {
    const cfg = {
      questions: [{ id: 'q1', label: 'Nome', type: 'TEXT_SHORT', required: true }],
    }
    expect(
      validateStageSubmission(PipelineStageKind.QUESTIONNAIRE, cfg, {
        answers: [{ questionId: 'q1', value: 'Andre' }],
      }),
    ).toEqual({ answers: [{ questionId: 'q1', value: 'Andre' }] })
  })

  it('rejeita resposta obrigatória em falta', () => {
    const cfg = {
      questions: [{ id: 'q1', label: 'Nome', type: 'TEXT_SHORT', required: true }],
    }
    expect(() =>
      validateStageSubmission(PipelineStageKind.QUESTIONNAIRE, cfg, { answers: [] }),
    ).toThrow(BadRequestException)
  })

  it('rejeita SINGLE_CHOICE com valor fora das opções', () => {
    const cfg = {
      questions: [
        {
          id: 'q1',
          label: 'Senioridade',
          type: 'SINGLE_CHOICE',
          required: true,
          options: ['Junior', 'Senior'],
        },
      ],
    }
    expect(() =>
      validateStageSubmission(PipelineStageKind.QUESTIONNAIRE, cfg, {
        answers: [{ questionId: 'q1', value: 'Pleno' }],
      }),
    ).toThrow(BadRequestException)
  })

  it('valida FILE_UPLOAD com PDF dentro do limite', () => {
    expect(
      validateStageSubmission(
        PipelineStageKind.FILE_UPLOAD,
        {},
        {
          fileKey: 'k/a.pdf',
          mimeType: 'application/pdf',
          fileSize: 1000,
        },
        { s3MaxUploadBytes: 10 * 1024 * 1024 },
      ),
    ).toEqual({ fileKey: 'k/a.pdf', mimeType: 'application/pdf', sizeBytes: 1000 })
  })

  it('rejeita FILE_UPLOAD com mime fora da lista fixa', () => {
    expect(() =>
      validateStageSubmission(
        PipelineStageKind.FILE_UPLOAD,
        {},
        { fileKey: 'k/a', mimeType: 'application/zip' },
        { s3MaxUploadBytes: 10 * 1024 * 1024 },
      ),
    ).toThrow(BadRequestException)
  })

  it('rejeita FILE_UPLOAD excedendo o limite efectivo (S3 e tecto da pipeline)', () => {
    expect(() =>
      validateStageSubmission(
        PipelineStageKind.FILE_UPLOAD,
        {},
        {
          fileKey: 'k/a',
          mimeType: 'application/pdf',
          fileSize: 9 * 1024 * 1024,
        },
        { s3MaxUploadBytes: 5 * 1024 * 1024 },
      ),
    ).toThrow(BadRequestException)
  })
})

describe('validateInterviewLinkRecruiterPayload', () => {
  it('aceita URL válida', () => {
    expect(validateInterviewLinkRecruiterPayload({ url: 'https://meet.example.com/abc' })).toEqual({
      url: 'https://meet.example.com/abc',
      scheduledAt: undefined,
    })
  })

  it('rejeita URL inválida', () => {
    expect(() => validateInterviewLinkRecruiterPayload({ url: 'nao-e-url' })).toThrow(
      BadRequestException,
    )
  })

  it('rejeita scheduledAt inválida', () => {
    expect(() =>
      validateInterviewLinkRecruiterPayload({ url: 'https://x.io', scheduledAt: 'amanha' }),
    ).toThrow(BadRequestException)
  })
})
