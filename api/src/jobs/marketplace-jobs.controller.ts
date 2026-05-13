import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/public.decorator'
import { ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional } from '../tenant-context/tenant.decorators'
import { MarketplaceJobListQueryDto } from './dto/marketplace-job-list-query.dto'
import { GetMarketplaceJobFilterOptionsUseCase } from './use-cases/get-marketplace-job-filter-options.use-case'
import { ListMarketplaceJobsUseCase } from './use-cases/list-marketplace-jobs.use-case'

@Public()
@Controller('jobs/public')
@ApiTags('Jobs (explorar)')
@ApiStandardErrors(true)
@TenantOptional()
export class MarketplaceJobsController {
  constructor(
    private readonly listMarketplaceJobs: ListMarketplaceJobsUseCase,
    private readonly filterOptions: GetMarketplaceJobFilterOptionsUseCase,
  ) {}

  @Get('filters')
  @ApiOperation({
    summary: 'Opções de filtro do explorar vagas',
    description:
      'Valores distintos de modalidade, local e senioridade, e empresas com vagas publicáveis, alinhados às mesmas regras do listado público (tenant ativo; `PUBLISHED` ou `PAUSED`).',
  })
  @ApiOkResponse({
    description: '`modalities`, `locations`, `seniorities` (strings); `tenants` com `id` e `name`',
  })
  async listFilterOptions() {
    return this.filterOptions.execute()
  }

  @Get()
  @ApiOperation({
    summary: 'Listar vagas publicáveis (marketplace)',
    description:
      'Apenas empresas ativas; vagas `PUBLISHED` ou `PAUSED`. Filtros opcionais: texto (`q`), modality, location, seniority, `tenantId`.',
  })
  @ApiOkResponse({ description: '`items` com `job` + `tenant`; `total`, `page`, `limit`' })
  async list(@Query() query: MarketplaceJobListQueryDto) {
    return this.listMarketplaceJobs.execute({
      page: query.page,
      limit: query.limit,
      q: query.q,
      modality: query.modality,
      location: query.location,
      seniority: query.seniority,
      tenantId: query.tenantId,
    })
  }
}
