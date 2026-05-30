import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  Res,
  UnauthorizedException,
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
import type { Request as ExpressRequest, Response } from 'express'
import type { User } from '../../generated/prisma/client'
import { UserRole } from '../../generated/prisma/client'
import {
  AuthSessionStatusDto,
  B2BAccountResponseDto,
  RegisterTenantAdminPendingResponseDto,
  SessionClaimsResponseDto,
} from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import { AUTH_REFRESH_COOKIE_NAME } from './auth-cookies.constants'
import { AuthCookiesService } from './auth-cookies.service'
import { AuthSessionService } from './auth-session.service'
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

const MIN_REFRESH_LEN = 20

interface RequestWithUser extends ExpressRequest {
  user: User
}

interface RequestWithJwt extends ExpressRequest {
  user?: JwtPayload
}

function pickOpaqueRefresh(body: RefreshTokensDto, req: ExpressRequest): string {
  const fromBody = typeof body.refresh_token === 'string' ? body.refresh_token.trim() : ''
  const cookieJar = req.cookies?.[AUTH_REFRESH_COOKIE_NAME]
  const fromCookie = typeof cookieJar === 'string' ? cookieJar : ''
  if (fromBody.length >= MIN_REFRESH_LEN) return fromBody
  if (fromCookie.length >= MIN_REFRESH_LEN) return fromCookie
  return ''
}

function pickLogoutRefresh(body: LogoutDto, req: ExpressRequest): string | undefined {
  const fromBody = typeof body.refresh_token === 'string' ? body.refresh_token.trim() : ''
  const cookieJar = req.cookies?.[AUTH_REFRESH_COOKIE_NAME]
  const fromCookie = typeof cookieJar === 'string' ? cookieJar : ''
  if (fromBody.length >= MIN_REFRESH_LEN) return fromBody
  if (fromCookie.length >= MIN_REFRESH_LEN) return fromCookie
  return undefined
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
    private readonly authCookies: AuthCookiesService,
    private readonly authSession: AuthSessionService,
  ) {}

  @Public()
  @Get('session')
  @ApiOperation({
    summary: 'Estado da sessão (sem expor JWT no JSON)',
    description:
      'Indica access JWT válido lido por `Authorization` ou cookie httpOnly definido pela API nos endpoints de sessão.',
  })
  @ApiOkResponse({
    type: AuthSessionStatusDto,
  })
  getSession(@Request() req: ExpressRequest): AuthSessionStatusDto {
    const user = this.authSession.tryReadAccessPayload(req)
    if (!user) {
      return { authenticated: false }
    }
    return {
      authenticated: true,
      sub: user.sub,
      role: user.role,
      tenantId: user.tenantId ?? null,
    }
  }

  @Public()
  @Delete('session/cookies')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover apenas cookies da sessão (httpOnly)',
    description:
      'Público. Limpa `Set-Cookie` sem revogar refresh na base. Útil após 401 no cliente antes de novo login.',
  })
  clearSessionCookies(@Res({ passthrough: true }) res: Response): void {
    this.authCookies.clear(res)
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Login (local strategy)',
    description:
      'Define cookies httpOnly de access + refresh (`SameSite=Lax`). O JSON só traz dados públicos do token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    type: SessionClaimsResponseDto,
    description:
      'Identidade da sessão. Também aplique Swagger com `Authorize` usando o Bearer do primeiro login se usar esta UI sem navegador.',
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  async login(
    @Body() _body: LoginDto,
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionClaimsResponseDto> {
    const tokens = await this.loginUseCase.execute(req.user)
    this.authCookies.attachTokens(res, tokens)
    return this.authSession.publicClaims(tokens)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar tokens com refresh opaco',
    description:
      'Aceita refresh no corpo ou no cookie httpOnly quando `credentials` é enviado no pedido.',
  })
  @ApiBody({ type: RefreshTokensDto, required: false })
  @ApiOkResponse({ type: SessionClaimsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh inválido ou expirado' })
  async refresh(
    @Body(new DefaultValuePipe({})) body: RefreshTokensDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionClaimsResponseDto> {
    const refreshToken = pickOpaqueRefresh(body, req)
    if (refreshToken.length < MIN_REFRESH_LEN) {
      throw new UnauthorizedException('Missing refresh token')
    }
    const tokens = await this.refreshTokens.execute(refreshToken)
    this.authCookies.attachTokens(res, tokens)
    return this.authSession.publicClaims(tokens)
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Logout (revogar refresh na base)',
    description:
      'Corrige também os cookies da sessão. Com refresh no corpo ou cookie revoga só essa sessão; sem refresh revoga todos os refresh tokens ativos.',
  })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiNoContentResponse({ description: 'Refresh revogado na base e cookies limpos.' })
  @ApiStandardErrors(true)
  async logout(
    @Request() req: RequestWithJwt,
    @Body(new DefaultValuePipe({})) body: LogoutDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const user = req.user
    if (!user) throw new ForbiddenException('Missing authentication')
    const refreshOpaque = pickLogoutRefresh(body, req)
    await this.logoutUseCase.execute(user.sub, refreshOpaque)
    this.authCookies.clear(res)
  }

  @Public()
  @Post('register/candidate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastro de candidato (one-profile) + JWT',
    description: 'Igual ao login relativamente a cookies httpOnly.',
  })
  @ApiCreatedResponse({
    type: SessionClaimsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'E-mail já em uso ou validação do corpo' })
  async registerCandidate(
    @Body() body: RegisterCandidateDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionClaimsResponseDto> {
    const tokens = await this.registerCandidateUseCase.execute(body)
    this.authCookies.attachTokens(res, tokens)
    return this.authSession.publicClaims(tokens)
  }

  @Public()
  @Post('register/tenant-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pedido de cadastro de empresa (administrador)',
    description:
      'Cria tenant inativo e usuário TENANT_ADMIN. O slug público é derivado automaticamente do nome da empresa. O SUPER_ADMIN aprova em `PATCH /tenants/:id/approve-signup` antes do login B2B funcionar.',
  })
  @ApiBody({ type: RegisterTenantAdminDto })
  @ApiCreatedResponse({
    type: RegisterTenantAdminPendingResponseDto,
    description: 'Pedido registrado; sem tokens até aprovação',
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
