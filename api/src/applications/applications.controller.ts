import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import { UserRole } from '../../generated/prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/jwt-payload'
import { Roles } from '../auth/rbac/roles.decorator'
import {
  ApplicationCandidateListItemDto,
  ApplicationCurrentStageResponseDto,
  ApplicationResponseDto,
  ApplicationStageProgressResponseDto,
  SourceCandidateResultDto,
} from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { MoveApplicationStageDto } from '../pipelines/dto/move-application-stage.dto'
import { SetInterviewLinkDto } from '../pipelines/dto/set-interview-link.dto'
import { GetMyCurrentStageUseCase } from '../pipelines/use-cases/get-my-current-stage.use-case'
import { ListApplicationProgressUseCase } from '../pipelines/use-cases/list-application-progress.use-case'
import { MoveApplicationStageUseCase } from '../pipelines/use-cases/move-application-stage.use-case'
import { SetInterviewLinkUseCase } from '../pipelines/use-cases/set-interview-link.use-case'
import { SubmitCurrentStageUseCase } from '../pipelines/use-cases/submit-current-stage.use-case'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import {
  MyApplicationsListQueryDto,
  TenantApplicationsListQueryDto,
} from './dto/application-list-query.dto'
import { MoveApplicationDto } from './dto/move-application.dto'
import { SourceDto } from './dto/source.dto'
import { GetApplicationForTenantUseCase } from './use-cases/get-application-for-tenant.use-case'
import { GetMyApplicationUseCase } from './use-cases/get-my-application.use-case'
import { ListApplicationsForTenantUseCase } from './use-cases/list-applications-for-tenant.use-case'
import { ListMyApplicationsUseCase } from './use-cases/list-my-applications.use-case'
import { MoveApplicationUseCase } from './use-cases/move-application.use-case'
import { SourceCandidateUseCase } from './use-cases/source-candidate.use-case'
import { WithdrawMyApplicationUseCase } from './use-cases/withdraw-my-application.use-case'

interface RequestWithUser extends ExpressRequest {
  user?: JwtPayload
}

function requireUser(req: RequestWithUser): JwtPayload {
  const user = req.user
  if (!user) throw new ForbiddenException('Missing authentication')
  return user
}

@Controller('applications')
@ApiTags('Applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(
    private readonly sourceCandidate: SourceCandidateUseCase,
    private readonly listApplicationsForTenant: ListApplicationsForTenantUseCase,
    private readonly listMyApplications: ListMyApplicationsUseCase,
    private readonly getApplicationForTenant: GetApplicationForTenantUseCase,
    private readonly getMyApplication: GetMyApplicationUseCase,
    private readonly withdrawMyApplication: WithdrawMyApplicationUseCase,
    private readonly moveApplication: MoveApplicationUseCase,
    private readonly moveApplicationStage: MoveApplicationStageUseCase,
    private readonly listApplicationProgress: ListApplicationProgressUseCase,
    private readonly getMyCurrentStage: GetMyCurrentStageUseCase,
    private readonly submitCurrentStage: SubmitCurrentStageUseCase,
    private readonly setInterviewLink: SetInterviewLinkUseCase,
  ) {}

  @Post('sourced')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Sourcing: nudge por email a um candidato para uma vaga',
    description:
      'Comportamento conforme o estado do email no email indicado:\n' +
      '- `CANDIDATE_INVITED`: candidato sem conta na plataforma, envia link de ativação que cria usuário `CANDIDATE` ao aceitar.\n' +
      '- `JOB_LINK_SENT`: candidato já tem conta mas ainda não se candidatou a esta vaga, envia email apenas com o link público da vaga.\n' +
      '- `ALREADY_APPLIED`: candidato já tem candidatura para a vaga; nenhum email é enviado.',
  })
  @ApiBody({ type: SourceDto })
  @ApiCreatedResponse({ type: SourceCandidateResultDto })
  @ApiStandardErrors(true)
  async sourced(@Request() req: RequestWithUser, @Body() body: SourceDto) {
    const user = requireUser(req)
    return this.sourceCandidate.execute({ userId: user.sub, role: user.role as UserRole }, body)
  }

  @Get()
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Listar candidaturas do tenant (paginação e filtros por status e jobId)',
  })
  @ApiOkResponse({ description: '`items`, `total`, `page`, `limit`' })
  async listForTenant(
    @Request() req: RequestWithUser,
    @Query() query: TenantApplicationsListQueryDto,
  ) {
    const user = requireUser(req)
    return this.listApplicationsForTenant.execute(
      { userId: user.sub, role: user.role as UserRole },
      {
        page: query.page,
        limit: query.limit,
        status: query.status,
        jobId: query.jobId,
      },
    )
  }

  @Get('me')
  @TenantOptional()
  @Roles(UserRole.CANDIDATE)
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Minhas candidaturas (paginação e filtro por status)' })
  @ApiOkResponse({ description: '`items`, `total`, `page`, `limit`' })
  async listMine(@Request() req: RequestWithUser, @Query() query: MyApplicationsListQueryDto) {
    const user = requireUser(req)
    return this.listMyApplications.execute(
      { userId: user.sub, role: user.role as UserRole },
      { page: query.page, limit: query.limit, status: query.status },
    )
  }

  @Get('me/:applicationId')
  @TenantOptional()
  @Roles(UserRole.CANDIDATE)
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Detalhe de uma candidatura (candidato)' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiOkResponse({ type: ApplicationCandidateListItemDto })
  async getMine(@Request() req: RequestWithUser, @Param('applicationId') applicationId: string) {
    const user = requireUser(req)
    return this.getMyApplication.execute(
      { userId: user.sub, role: user.role as UserRole },
      applicationId,
    )
  }

  @Post('me/:applicationId/withdraw')
  @TenantOptional()
  @Roles(UserRole.CANDIDATE)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Desistir da candidatura',
    description: 'Permitido em SOURCED, APPLIED ou IN_PROGRESS.',
  })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiOkResponse({ type: ApplicationResponseDto })
  async withdraw(@Request() req: RequestWithUser, @Param('applicationId') applicationId: string) {
    const user = requireUser(req)
    return this.withdrawMyApplication.execute(
      { userId: user.sub, role: user.role as UserRole },
      applicationId,
    )
  }

  @Get(':id')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({ summary: 'Detalhe de candidatura (tenant)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Inclui candidate e job' })
  async getForTenant(@Request() req: RequestWithUser, @Param('id') id: string) {
    const user = requireUser(req)
    return this.getApplicationForTenant.execute(
      { userId: user.sub, role: user.role as UserRole },
      id,
    )
  }

  @Patch(':id/move')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  async move(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: MoveApplicationDto,
  ) {
    const user = requireUser(req)
    return this.moveApplication.execute({ userId: user.sub, role: user.role as UserRole }, id, body)
  }

  @Patch(':id/stage')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Mover a etapa atual da candidatura',
    description:
      'Define `currentJobStageId`, cria progress em PENDING (idempotente) e regista snapshot em ApplicationHistory.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: MoveApplicationStageDto })
  @ApiOkResponse({ type: ApplicationStageProgressResponseDto })
  async moveStage(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: MoveApplicationStageDto,
  ) {
    const user = requireUser(req)
    return this.moveApplicationStage.execute(
      { userId: user.sub, role: user.role as UserRole },
      { applicationId: id, jobStageId: body.jobStageId },
    )
  }

  @Get(':id/progress')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({ summary: 'Progresso por etapa da candidatura (uso B2B)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: [ApplicationStageProgressResponseDto] })
  async listProgress(@Request() req: RequestWithUser, @Param('id') id: string) {
    const user = requireUser(req)
    return this.listApplicationProgress.execute(
      { userId: user.sub, role: user.role as UserRole },
      id,
    )
  }

  @Patch(':id/stage/:jobStageId/interviewLink')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Define ou atualiza URL e horário da entrevista para a candidatura',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'jobStageId', format: 'uuid' })
  @ApiBody({ type: SetInterviewLinkDto })
  @ApiOkResponse({ type: ApplicationStageProgressResponseDto })
  async setInterview(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('jobStageId') jobStageId: string,
    @Body() body: SetInterviewLinkDto,
  ) {
    const user = requireUser(req)
    return this.setInterviewLink.execute(
      { userId: user.sub, role: user.role as UserRole },
      id,
      jobStageId,
      body,
    )
  }

  @Get('me/:applicationId/currentStage')
  @TenantOptional()
  @Roles(UserRole.CANDIDATE)
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Etapa atual da minha candidatura com a configuração visível' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiOkResponse({ type: ApplicationCurrentStageResponseDto })
  async getMyStage(@Request() req: RequestWithUser, @Param('applicationId') applicationId: string) {
    const user = requireUser(req)
    return this.getMyCurrentStage.execute(
      { userId: user.sub, role: user.role as UserRole },
      applicationId,
    )
  }

  @Post('me/:applicationId/currentStage/submit')
  @TenantOptional()
  @Roles(UserRole.CANDIDATE)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Submete dados da etapa atual',
    description:
      'Validação por kind: QUESTIONNAIRE espera `{ answers }`. FILE_UPLOAD espera `{ fileKey, mimeType, fileSize }` (tipos e limite de tamanho fixos na API). MANUAL e INTERVIEW_LINK não aceitam submissões aqui.',
  })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiOkResponse({ type: ApplicationStageProgressResponseDto })
  async submitMyStage(
    @Request() req: RequestWithUser,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
  ) {
    const user = requireUser(req)
    return this.submitCurrentStage.execute(
      { userId: user.sub, role: user.role as UserRole },
      applicationId,
      body,
    )
  }
}
