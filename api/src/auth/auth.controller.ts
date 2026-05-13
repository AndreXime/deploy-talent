import {
  Body,
  Controller,
  DefaultValuePipe,
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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import type { User } from '../../generated/prisma/client'
import { UserRole } from '../../generated/prisma/client'
import {
  B2BAccountResponseDto,
  RegisterTenantAdminPendingResponseDto,
  SessionTokensDto,
} from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import { LoginDto } from './dto/login.dto'
import { LogoutDto } from './dto/logout.dto'
import { RefreshTokensDto } from './dto/refresh-tokens.dto'
import { RegisterCandidateDto } from './dto/register-candidate.dto'
import { RegisterTenantAdminDto } from './dto/register-tenant-admin.dto'
import { UpdateB2BAvatarDto } from './dto/update-b2b-avatar.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { LocalAuthGuard } from './guards/local-auth.guard'
import type { JwtPayload } from './jwt-payload'
import { Public } from './public.decorator'
import { Roles } from './rbac/roles.decorator'
import { GetMyB2BAccountUseCase } from './use-cases/get-my-b2b-account.use-case'
import { LoginUseCase } from './use-cases/login.use-case'
import { LogoutUseCase } from './use-cases/logout.use-case'
import { RefreshTokensUseCase } from './use-cases/refresh-tokens.use-case'
import { RegisterCandidateUseCase } from './use-cases/register-candidate.use-case'
import { RegisterTenantAdminUseCase } from './use-cases/register-tenant-admin.use-case'
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
    private readonly refreshTokens: RefreshTokensUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly registerCandidateUseCase: RegisterCandidateUseCase,
    private readonly registerTenantAdminUseCase: RegisterTenantAdminUseCase,
    private readonly updateB2BAvatar: UpdateB2BAvatarUseCase,
    private readonly getMyB2BAccount: GetMyB2BAccountUseCase,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login (local strategy)' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    type: SessionTokensDto,
    description: 'Access (curto) + refresh (24h por padrão)',
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  async login(@Body() _body: LoginDto, @Request() req: RequestWithUser) {
    return this.loginUseCase.execute(req.user)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar tokens com refresh opaco' })
  @ApiBody({ type: RefreshTokensDto })
  @ApiOkResponse({ type: SessionTokensDto })
  @ApiUnauthorizedResponse({ description: 'Refresh inválido ou expirado' })
  async refresh(@Body() body: RefreshTokensDto) {
    return this.refreshTokens.execute(body.refresh_token)
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Logout (revogar refresh na base)',
    description:
      'Com `refresh_token` no corpo revoga só essa sessão; sem corpo (ou `{}`) revoga todos os refresh ativos do utilizador. O access JWT continua válido até expirar.',
  })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiNoContentResponse({ description: 'Refresh revogado na base' })
  @ApiStandardErrors(true)
  async logout(
    @Request() req: RequestWithJwt,
    @Body(new DefaultValuePipe({})) body: LogoutDto,
  ): Promise<void> {
    const user = req.user
    if (!user) throw new ForbiddenException('Missing authentication')
    await this.logoutUseCase.execute(user.sub, body.refresh_token)
  }

  @Public()
  @Post('register/candidate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastro de candidato (one-profile) + JWT' })
  @ApiCreatedResponse({
    type: SessionTokensDto,
    description: 'Conta criada; retorna o mesmo formato do login',
  })
  @ApiBadRequestResponse({ description: 'E-mail já em uso ou validação do corpo' })
  async registerCandidate(@Body() body: RegisterCandidateDto) {
    return this.registerCandidateUseCase.execute(body)
  }

  @Public()
  @Post('register/tenant-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pedido de registo de empresa (administrador)',
    description:
      'Cria tenant inactivo e utilizador TENANT_ADMIN. O slug público deriva-se automaticamente do nome da empresa. O SUPER_ADMIN aprova em `PATCH /tenants/:id/approve-signup` antes do login B2B funcionar.',
  })
  @ApiBody({ type: RegisterTenantAdminDto })
  @ApiCreatedResponse({
    type: RegisterTenantAdminPendingResponseDto,
    description: 'Pedido registado; sem tokens até aprovação',
  })
  @ApiConflictResponse({ description: 'E-mail já em uso' })
  @ApiBadRequestResponse({ description: 'Validação do corpo' })
  async registerTenantAdmin(@Body() body: RegisterTenantAdminDto) {
    return this.registerTenantAdminUseCase.execute({
      companyName: body.companyName,
      email: body.email,
      password: body.password,
    })
  }

  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @Get('me')
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Conta B2B do usuário autenticado',
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
