import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/public.decorator'
import { JobResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional } from '../tenant-context/tenant.decorators'
import { PublicJobListQueryDto } from './dto/public-job-list-query.dto'
import { GetPublicJobUseCase } from './use-cases/get-public-job.use-case'
import { ListPublicJobsForTenantUseCase } from './use-cases/list-public-jobs-for-tenant.use-case'

@Public()
@Controller('tenants/:tenantId/jobs')
@ApiTags('Jobs (career site)')
@ApiStandardErrors(true)
@TenantOptional()
export class TenantPublicJobsController {
  constructor(
    private readonly listPublicJobs: ListPublicJobsForTenantUseCase,
    private readonly getPublicJob: GetPublicJobUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar vagas abertas (PUBLISHED ou PAUSED)',
    description:
      'Público; `tenantId` na URL. Paginação (`page`, `limit`) e filtros opcionais: texto (`q`), `modality`, `location`, `seniority`.',
  })
  @ApiOkResponse({ description: 'Lista paginada de vagas' })
  async list(@Query() query: PublicJobListQueryDto) {
    return this.listPublicJobs.execute({
      page: query.page,
      limit: query.limit,
      q: query.q,
      modality: query.modality,
      location: query.location,
      seniority: query.seniority,
    })
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Detalhe de uma vaga publicável' })
  @ApiParam({ name: 'jobId', format: 'uuid' })
  @ApiOkResponse({ type: JobResponseDto })
  async get(@Param('jobId') jobId: string) {
    return this.getPublicJob.execute(jobId)
  }
}
