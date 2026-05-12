import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import type { User } from '../../generated/prisma/client'
import { UserRole } from '../../generated/prisma/client'
import { AccessTokenDto, B2BAccountResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import { LoginDto } from './dto/login.dto'
import { RegisterCandidateDto } from './dto/register-candidate.dto'
import { UpdateB2BAvatarDto } from './dto/update-b2b-avatar.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { LocalAuthGuard } from './guards/local-auth.guard'
import type { JwtPayload } from './jwt-payload'
import { Public } from './public.decorator'
import { Roles } from './rbac/roles.decorator'
import { GetMyB2BAccountUseCase } from './use-cases/get-my-b2b-account.use-case'
import { LoginUseCase } from './use-cases/login.use-case'
import { RegisterCandidateUseCase } from './use-cases/register-candidate.use-case'
import { UpdateB2BAvatarUseCase } from './use-cases/update-b2b-avatar.use-case'

interface RequestWithUser extends ExpressRequest {
  user: User
}

interface RequestWithJwt extends ExpressRequest {
  user?: JwtPayload
}

@Controller('auth')
@ApiTags('Auth')
@TenantOptional()
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerCandidateUseCase: RegisterCandidateUseCase,
    private readonly updateB2BAvatar: UpdateB2BAvatarUseCase,
    private readonly getMyB2BAccount: GetMyB2BAccountUseCase,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login (local strategy)' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AccessTokenDto, description: 'JWT para uso em rotas protegidas' })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  async login(@Body() _body: LoginDto, @Request() req: RequestWithUser) {
    return this.loginUseCase.execute(req.user)
  }

  @Public()
  @Post('register/candidate')
  @ApiOperation({ summary: 'Cadastro de candidato (one-profile) + JWT' })
  @ApiCreatedResponse({
    type: AccessTokenDto,
    description: 'Conta criada; retorna o mesmo formato do login',
  })
  @ApiBadRequestResponse({ description: 'E-mail já em uso ou validação do corpo' })
  async registerCandidate(@Body() body: RegisterCandidateDto) {
    return this.registerCandidateUseCase.execute(body)
  }

  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @Get('me')
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Conta B2B do utilizador autenticado',
    description: 'Inclui `avatarUrl` (URL GET assinada) em vez da chave S3 crua.',
  })
  @ApiOkResponse({ type: B2BAccountResponseDto })
  @ApiStandardErrors(true)
  async getMe(@Request() req: RequestWithJwt) {
    const user = req.user
    if (!user) throw new ForbiddenException('Missing authentication')
    return this.getMyB2BAccount.execute(user.sub, user.role as UserRole)
  }

  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @Patch('me/avatar')
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Atualizar foto do usuário B2B',
    description:
      'Use `POST /media/presign-upload` com `B2B_USER_AVATAR`, envie a `key` aqui. String vazia remove a foto.',
  })
  @ApiBody({ type: UpdateB2BAvatarDto })
  @ApiOkResponse({ type: B2BAccountResponseDto })
  @ApiStandardErrors(true)
  async patchMyAvatar(@Request() req: RequestWithJwt, @Body() body: UpdateB2BAvatarDto) {
    const user = req.user
    if (!user) throw new ForbiddenException('Missing authentication')
    await this.updateB2BAvatar.execute(
      user.sub,
      user.tenantId,
      user.role as UserRole,
      body.avatarKey,
    )
    return this.getMyB2BAccount.execute(user.sub, user.role as UserRole)
  }
}
