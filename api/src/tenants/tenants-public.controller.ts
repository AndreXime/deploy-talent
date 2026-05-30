import { Controller, Get, Param } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/public.decorator'
import { TenantSnippetDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional } from '../tenant-context/tenant.decorators'
import { GetTenantBySlugUseCase } from './use-cases/get-tenant-by-slug.use-case'

@Public()
@Controller('tenants/public')
@ApiTags('Tenants (público)')
@ApiStandardErrors(true)
@TenantOptional()
export class TenantsPublicController {
  constructor(private readonly getTenantBySlug: GetTenantBySlugUseCase) {}

  @Get('by-slug/:slug')
  @ApiOperation({
    summary: 'Resolver empresa pelo slug',
    description:
      'Público; apenas tenant ativo e não eliminado. Retorna dados mínimos (incl. `id` para rotas `/tenants/:tenantId/jobs`).',
  })
  @ApiParam({ name: 'slug', example: 'acme-corp' })
  @ApiOkResponse({ type: TenantSnippetDto })
  async bySlug(@Param('slug') slug: string) {
    return this.getTenantBySlug.execute(slug)
  }
}
