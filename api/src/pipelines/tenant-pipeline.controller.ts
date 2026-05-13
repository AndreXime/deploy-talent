import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '../../generated/prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../auth/rbac/roles.decorator'
import { PipelineTemplateResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantRequired } from '../tenant-context/tenant.decorators'
import { ReplacePipelineTemplateDto } from './dto/replace-pipeline-template.dto'
import { GetTenantPipelineTemplateUseCase } from './use-cases/get-tenant-pipeline-template.use-case'
import { ReplaceTenantPipelineTemplateUseCase } from './use-cases/replace-tenant-pipeline-template.use-case'

@Controller('tenants/current/pipeline')
@ApiTags('Pipeline')
@UseGuards(JwtAuthGuard)
@TenantRequired()
@ApiJwtTenantB2b()
@ApiStandardErrors(true)
export class TenantPipelineController {
  constructor(
    private readonly getTemplate: GetTenantPipelineTemplateUseCase,
    private readonly replaceTemplate: ReplaceTenantPipelineTemplateUseCase,
  ) {}

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiOperation({
    summary: 'Template default de pipeline do tenant',
    description: 'Cria automaticamente com uma etapa MANUAL "Triagem" se ainda não existir.',
  })
  @ApiOkResponse({ type: PipelineTemplateResponseDto })
  async findOne() {
    return this.getTemplate.execute()
  }

  @Put()
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Substitui a lista ordenada de etapas do template default',
    description: 'Operação idempotente: apaga as etapas existentes e cria as enviadas.',
  })
  @ApiBody({ type: ReplacePipelineTemplateDto })
  @ApiOkResponse({ type: PipelineTemplateResponseDto })
  async replace(@Body() body: ReplacePipelineTemplateDto) {
    return this.replaceTemplate.execute({ stages: body.stages })
  }
}
