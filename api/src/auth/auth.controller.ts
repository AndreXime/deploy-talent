import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { User } from '../../generated/prisma/client'
import { UserRole } from '../../generated/prisma/client'
import type { JwtPayload } from './jwt-payload'
// (Jwt payload handled by passport)
import { AccessTokenDto, ProvisionedUserDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import { CreateRecruiterDto } from './dto/create-recruiter.dto'
import { CreateTenantAdminDto } from './dto/create-tenant-admin.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterCandidateDto } from './dto/register-candidate.dto'
import { UpdateB2BAvatarDto } from './dto/update-b2b-avatar.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { Public } from './public.decorator'
import { Roles } from './rbac/roles.decorator'
import { CreateRecruiterUseCase } from './use-cases/create-recruiter.use-case'
import { CreateTenantAdminUseCase } from './use-cases/create-tenant-admin.use-case'
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
    private readonly createTenantAdminUseCase: CreateTenantAdminUseCase,
    private readonly createRecruiterUseCase: CreateRecruiterUseCase,
    private readonly updateB2BAvatar: UpdateB2BAvatarUseCase,
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
  @Roles(UserRole.SUPER_ADMIN)
  @Post('register/tenant-admin')
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Criar usuário TENANT_ADMIN',
    description: 'Apenas `SUPER_ADMIN`. O admin passa a operar no tenant informado no corpo.',
  })
  @ApiCreatedResponse({ type: ProvisionedUserDto })
  @ApiStandardErrors(true)
  async createTenantAdmin(@Body() body: CreateTenantAdminDto) {
    return this.createTenantAdminUseCase.execute(body)
  }

  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN)
  @Post('register/recruiter')
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Convidar recrutador no tenant atual',
    description: '`TENANT_ADMIN`; tenant vem do JWT.',
  })
  @ApiCreatedResponse({ type: ProvisionedUserDto })
  @ApiStandardErrors(true)
  async createRecruiter(@Body() body: CreateRecruiterDto) {
    return this.createRecruiterUseCase.execute(body)
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
  @ApiOkResponse({ description: 'Usuário atualizado (inclui `avatarKey`)' })
  @ApiStandardErrors(true)
  async patchMyAvatar(@Request() req: RequestWithJwt, @Body() body: UpdateB2BAvatarDto) {
    const user = req.user
    if (!user) throw new ForbiddenException('Missing authentication')
    return this.updateB2BAvatar.execute(
      user.sub,
      user.tenantId,
      user.role as UserRole,
      body.avatarKey,
    )
  }
}
