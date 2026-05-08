import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import { UserRole } from '../../generated/prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../auth/rbac/roles.decorator'
import { JobResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantRequired } from '../tenant-context/tenant.decorators'
import { ChangeJobStatusDto } from './dto/change-job-status.dto'
import { CreateJobDto } from './dto/create-job.dto'
import { UpdateJobDto } from './dto/update-job.dto'
import { ChangeJobStatusUseCase } from './use-cases/change-job-status.use-case'
import { CreateJobUseCase } from './use-cases/create-job.use-case'
import { ListJobsUseCase } from './use-cases/list-jobs.use-case'
import { UpdateJobUseCase } from './use-cases/update-job.use-case'

@Controller('jobs')
@ApiTags('Jobs')
@ApiJwtTenantB2b()
@ApiStandardErrors()
@TenantRequired()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
export class JobsController {
  constructor(
    private readonly createJob: CreateJobUseCase,
    private readonly listJobs: ListJobsUseCase,
    private readonly updateJob: UpdateJobUseCase,
    private readonly changeJobStatus: ChangeJobStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar vaga (geralmente `DRAFT`)' })
  @ApiBody({ type: CreateJobDto })
  @ApiCreatedResponse({ type: JobResponseDto })
  async create(@Body() body: CreateJobDto) {
    return this.createJob.execute(body)
  }

  @Get()
  @ApiOperation({ summary: 'Listar vagas do tenant atual' })
  @ApiOkResponse({ type: JobResponseDto, isArray: true })
  async list() {
    return this.listJobs.execute()
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar campos editáveis da vaga' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateJobDto })
  @ApiOkResponse({ type: JobResponseDto })
  async update(@Param('id') id: string, @Body() body: UpdateJobDto) {
    return this.updateJob.execute(id, body)
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Transição de estado da vaga',
    description:
      'Máquina: DRAFT→PUBLISHED; PUBLISHED→PAUSED|CLOSED; PAUSED→PUBLISHED|CLOSED; CLOSED não transiciona.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: ChangeJobStatusDto })
  @ApiOkResponse({ type: JobResponseDto })
  async changeStatus(@Param('id') id: string, @Body() body: ChangeJobStatusDto) {
    return this.changeJobStatus.execute(id, body.status)
  }
}
