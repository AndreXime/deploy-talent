import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common'
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { UserRole } from '../../generated/prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../auth/rbac/roles.decorator'
import { PipelineStageResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantRequired } from '../tenant-context/tenant.decorators'
import { ReplacePipelineTemplateDto } from './dto/replace-pipeline-template.dto'
import { ListJobStagesUseCase } from './use-cases/list-job-stages.use-case'
import { ReplaceJobStagesUseCase } from './use-cases/replace-job-stages.use-case'

@Controller('jobs/:jobId/stages')
@ApiTags('Pipeline')
@UseGuards(JwtAuthGuard)
@TenantRequired()
@ApiJwtTenantB2b()
@ApiStandardErrors(true)
@ApiParam({ name: 'jobId', format: 'uuid' })
export class JobPipelineController {
  constructor(
    private readonly listStages: ListJobStagesUseCase,
    private readonly replaceStages: ReplaceJobStagesUseCase,
  ) {}

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Lista as etapas da vaga (clonadas do template default)' })
  @ApiOkResponse({ type: [PipelineStageResponseDto] })
  async list(@Param('jobId', new ParseUUIDPipe()) jobId: string) {
    return this.listStages.execute(jobId)
  }

  @Put()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiOperation({
    summary: 'Substitui a lista de etapas da vaga',
    description: 'Apenas vagas em DRAFT podem ter as etapas reescritas.',
  })
  @ApiBody({ type: ReplacePipelineTemplateDto })
  @ApiOkResponse({ type: [PipelineStageResponseDto] })
  async replace(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
    @Body() body: ReplacePipelineTemplateDto,
  ) {
    return this.replaceStages.execute(jobId, { stages: body.stages })
  }
}
