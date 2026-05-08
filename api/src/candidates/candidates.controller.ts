import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { UserRole } from '../../generated/prisma/client.js'
import type { JwtPayload } from '../auth/jwt-payload.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { Roles } from '../auth/rbac/roles.decorator.js'
import { CandidateProfileResponseDto } from '../infra/docs/dto/swagger-responses.dto.js'
import { ApiJwtAuth, ApiStandardErrors } from '../infra/docs/swagger-decorators.js'
import { TenantOptional } from '../tenant-context/tenant.decorators.js'
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto.js'
import { ForgetMeUseCase } from './use-cases/forget-me.use-case.js'
import { GetMyProfileUseCase } from './use-cases/get-my-profile.use-case.js'
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
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Perfil global do candidato',
    description: 'Sem tenant na URL para estes endpoints.',
  })
  @ApiOkResponse({ type: CandidateProfileResponseDto })
  async me(@Request() req: RequestWithUser) {
    return this.getMyProfile.execute(requireUser(req).sub)
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Atualizar perfil',
    description:
      'Nome, telefone, currículo (URL) e `avatarKey` (chave S3 após `POST /media/presign-upload` com `CANDIDATE_AVATAR`). String vazia em `avatarKey` remove a foto.',
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
}
