import { Controller, Get, Param } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/public.decorator'
import { PublicTenantBrandingResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional } from '../tenant-context/tenant.decorators'
import { GetPublicTenantBrandingUseCase } from './use-cases/get-public-tenant-branding.use-case'

@Public()
@Controller('tenants')
@ApiTags('Tenants (career site)')
@ApiStandardErrors(true)
@TenantOptional()
export class TenantBrandingPublicController {
  constructor(private readonly getPublicTenantBranding: GetPublicTenantBrandingUseCase) {}

  @Get(':tenantId/branding')
  @ApiOperation({
    summary: 'Logo e banner públicos (URLs pré-assinadas)',
    description: 'Não requer JWT. URLs expiram em poucos minutos.',
  })
  @ApiParam({ name: 'tenantId', format: 'uuid' })
  @ApiOkResponse({ type: PublicTenantBrandingResponseDto })
  async branding(@Param('tenantId') tenantId: string) {
    return this.getPublicTenantBranding.execute(tenantId)
  }
}
