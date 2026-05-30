import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import { UserRole } from '../../generated/prisma/client.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import type { JwtPayload } from '../auth/jwt-payload.js'
import { Roles } from '../auth/rbac/roles.decorator.js'
import {
  CandidateProfileResponseDto,
  CandidateSavedJobRowDto,
} from '../infra/docs/dto/swagger-responses.dto.js'
import { ApiJwtAuth, ApiStandardErrors } from '../infra/docs/swagger-decorators.js'
import { TenantOptional } from '../tenant-context/tenant.decorators.js'
import { ListSavedJobsQueryDto } from './dto/list-saved-jobs-query.dto.js'
import { SaveJobDto } from './dto/save-job.dto.js'
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto.js'
import { ForgetMeUseCase } from './use-cases/forget-me.use-case.js'
import { GetMyProfileUseCase } from './use-cases/get-my-profile.use-case.js'
import { ListSavedJobsUseCase } from './use-cases/list-saved-jobs.use-case.js'
import { SaveJobUseCase } from './use-cases/save-job.use-case.js'
import { UnsaveJobUseCase } from './use-cases/unsave-job.use-case.js'
import { UpdateMyProfileUseCase } from './use-cases/update-my-profile.use-case.js'

interface RequestWithUser extends ExpressRequest {
  user?: JwtPayload
}

function requireUser(req: RequestWithUser): JwtPayload {
  const user = req.user
  if (!user) throw new ForbiddenException('Missing authentication')
  return user
}

@Controller('candidates')
@ApiTags('Candidates')
@ApiJwtAuth()
@ApiStandardErrors()
@TenantOptional()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.CANDIDATE)
export class CandidatesController {
  constructor(
    private readonly getMyProfile: GetMyProfileUseCase,
    private readonly updateMyProfile: UpdateMyProfileUseCase,
    private readonly forgetMeUseCase: ForgetMeUseCase,
    private readonly listSavedJobs: ListSavedJobsUseCase,
    private readonly saveJob: SaveJobUseCase,
    private readonly unsaveJob: UnsaveJobUseCase,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Perfil global do candidato',
    description:
      'Sem tenant na URL. Em leitura, `resumeUrl` e `avatarUrl` são GET assinadas (substituem as chaves S3). Para atualizar arquivo, envie `resumeKey` / `avatarKey` após o presign de upload.',
  })
  @ApiOkResponse({ type: CandidateProfileResponseDto })
  async me(@Request() req: RequestWithUser) {
    return this.getMyProfile.execute(requireUser(req).sub)
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Atualizar perfil',
    description:
      'Nome, telefone, `resumeKey` e `avatarKey` (chaves S3 após `POST /media/presign-upload` com `CANDIDATE_RESUME` ou `CANDIDATE_AVATAR`). String vazia remove o arquivo.',
  })
  @ApiBody({ type: UpdateCandidateProfileDto })
  @ApiOkResponse({ type: CandidateProfileResponseDto })
  async updateMe(@Request() req: RequestWithUser, @Body() body: UpdateCandidateProfileDto) {
    return this.updateMyProfile.execute(requireUser(req).sub, body)
  }

  @Delete('me')
  @ApiOperation({
    summary: 'Anonimizar / esquecer perfil (LGPD-style)',
    description: 'Marca `deletedAt`/`anonymizedAt` e substitui dados pessoais por placeholders.',
  })
  @ApiOkResponse({ type: CandidateProfileResponseDto })
  async forgetMe(@Request() req: RequestWithUser) {
    return this.forgetMeUseCase.execute(requireUser(req).sub)
  }

  @Get('me/saved-jobs')
  @ApiOperation({
    summary: 'Listar vagas salvas',
    description: 'Paginação `page` / `limit`; cada item inclui vaga, empresa e `savedAt`.',
  })
  @ApiOkResponse({ description: '`items`, `total`, `page`, `limit`' })
  async listSaved(@Request() req: RequestWithUser, @Query() query: ListSavedJobsQueryDto) {
    const user = requireUser(req)
    return this.listSavedJobs.execute(
      { userId: user.sub, role: user.role as UserRole },
      { page: query.page, limit: query.limit },
    )
  }

  @Post('me/saved-jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Guardar vaga (favorito)',
    description:
      'Idempotente: se já existir, retorna o registro existente. Só vagas listáveis no marketplace.',
  })
  @ApiBody({ type: SaveJobDto })
  @ApiOkResponse({ type: CandidateSavedJobRowDto })
  async saveJobBookmark(@Request() req: RequestWithUser, @Body() body: SaveJobDto) {
    const user = requireUser(req)
    return this.saveJob.execute({ userId: user.sub, role: user.role as UserRole }, body.jobId)
  }

  @Delete('me/saved-jobs/:jobId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover vaga salva' })
  @ApiParam({ name: 'jobId', format: 'uuid' })
  async removeSaved(@Request() req: RequestWithUser, @Param('jobId') jobId: string) {
    const user = requireUser(req)
    await this.unsaveJob.execute({ userId: user.sub, role: user.role as UserRole }, jobId)
  }
}
