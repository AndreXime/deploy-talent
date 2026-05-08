import { applyDecorators } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiBearerAuth as ApiJwtBearer,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

/** Rotas protegidas com JWT (`Authorization: Bearer`). */
export function ApiJwtAuth() {
  return applyDecorators(ApiJwtBearer('bearer'))
}

/** Bearer apenas; tenant B2B vem do JWT. */
export function ApiJwtTenantB2b() {
  return applyDecorators(ApiJwtBearer('bearer'))
}

/** Erros comuns do filtro HTTP + RBAC / tenant guards. */
export function ApiStandardErrors(includeConflict = false) {
  const base = [
    ApiBadRequestResponse({
      description: 'Corpo ou parâmetro inválido, ou violação de regra de negócio',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer', example: 400 },
          error: { type: 'string' },
          message: { type: 'string', description: 'Mensagem detalhável (validação concatenada).' },
          path: { type: 'string', example: '/jobs' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado' }),
    ApiForbiddenResponse({
      description:
        'Papel insuficiente, tenant suspenso/inexistente ou contexto de tenant obrigatório/ausente',
    }),
    ApiNotFoundResponse({ description: 'Registro solicitado não encontrado neste tenant' }),
  ]

  const conflict = [
    ApiConflictResponse({
      description: 'Violação de unicidade ou conflito de estado (Prisma/constraints)',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer', example: 409 },
          error: { type: 'string' },
          message: { type: 'string' },
          path: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
  ]

  return applyDecorators(...base, ...(includeConflict ? conflict : []))
}
