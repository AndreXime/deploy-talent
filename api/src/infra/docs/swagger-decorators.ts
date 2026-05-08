import { applyDecorators } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiBearerAuth as ApiJwtBearer,
  ApiNotFoundResponse,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

/** Rotas protegidas com JWT (`Authorization: Bearer`). */
export function ApiJwtAuth() {
  return applyDecorators(ApiJwtBearer('bearer'))
}

/** Rotas tenant-scoped: enviar `X-Tenant-ID` = `Tenant.id` (UUID). */
export function ApiTenantScoped() {
  return applyDecorators(ApiSecurity('tenant'))
}

/** Bearer + tenant (B2B). */
export function ApiJwtTenantB2b() {
  return applyDecorators(ApiJwtBearer('bearer'), ApiSecurity('tenant'))
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
    ApiForbiddenResponse({ description: 'Papel insuficiente, tenant suspenso ou header `X-Tenant-ID` obrigatório/ausente' }),
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
