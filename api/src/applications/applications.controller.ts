import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import { UserRole } from '../../generated/prisma/client'
import type { JwtPayload } from '../auth/jwt-payload'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../auth/rbac/roles.decorator'
import {
  ApplicationCandidateListItemDto,
  ApplicationResponseDto,
  ApplicationTenantListItemDto,
  EvaluationResponseDto,
} from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import { ApplyDto } from './dto/apply.dto'
import { CreateEvaluationDto } from './dto/create-evaluation.dto'
import { MoveApplicationDto } from './dto/move-application.dto'
import { SourceDto } from './dto/source.dto'
import { ApplyToJobUseCase } from './use-cases/apply-to-job.use-case'
import { CreateEvaluationUseCase } from './use-cases/create-evaluation.use-case'
import { ListApplicationsForTenantUseCase } from './use-cases/list-applications-for-tenant.use-case'
import { ListMyApplicationsUseCase } from './use-cases/list-my-applications.use-case'
import { MoveApplicationUseCase } from './use-cases/move-application.use-case'
import { SourceCandidateUseCase } from './use-cases/source-candidate.use-case'

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
    private readonly applyToJob: ApplyToJobUseCase,
    private readonly sourceCandidate: SourceCandidateUseCase,
    private readonly listApplicationsForTenant: ListApplicationsForTenantUseCase,
    private readonly listMyApplications: ListMyApplicationsUseCase,
    private readonly moveApplication: MoveApplicationUseCase,
    private readonly createEvaluationUseCase: CreateEvaluationUseCase,
  ) {}

  @Post('apply')
  @TenantRequired()
  @Roles(UserRole.CANDIDATE)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Candidatar-se a uma vaga publicada ou pausada',
    description: '`CANDIDATE` + tenant da empresa na qual está se candidatando.',
  })
  @ApiBody({ type: ApplyDto })
  @ApiCreatedResponse({ type: ApplicationResponseDto })
  @ApiStandardErrors(true)
  async apply(@Request() req: RequestWithUser, @Body() body: ApplyDto) {
    const user = requireUser(req)
    return this.applyToJob.execute({ userId: user.sub, role: user.role as UserRole }, body)
  }

  @Post('sourced')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Sourcing: criar candidatura em estado SOURCED',
    description: 'Cria usuário candidato sob demanda quando o e-mail ainda não existir.',
  })
  @ApiBody({ type: SourceDto })
  @ApiCreatedResponse({ type: ApplicationResponseDto })
  @ApiStandardErrors(true)
  async sourced(@Request() req: RequestWithUser, @Body() body: SourceDto) {
    const user = requireUser(req)
    return this.sourceCandidate.execute({ userId: user.sub, role: user.role as UserRole }, body)
  }

  @Get()
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  async listForTenant(@Request() req: RequestWithUser) {
    const user = requireUser(req)
    return this.listApplicationsForTenant.execute({ userId: user.sub, role: user.role as UserRole })
  }

  @Get('me')
  @TenantOptional()
  @Roles(UserRole.CANDIDATE)
  async listMine(@Request() req: RequestWithUser) {
    const user = requireUser(req)
    return this.listMyApplications.execute({ userId: user.sub, role: user.role as UserRole })
  }

  @Patch(':id/move')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  async move(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: MoveApplicationDto,
  ) {
    const user = requireUser(req)
    return this.moveApplication.execute(
      { userId: user.sub, role: user.role as UserRole },
      id,
      body,
    )
  }

  @Post('evaluations')
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  async createEvaluation(@Request() req: RequestWithUser, @Body() body: CreateEvaluationDto) {
    const user = requireUser(req)
    return this.createEvaluationUseCase.execute(
      { userId: user.sub, role: user.role as UserRole },
      body,
    )
  }
}
