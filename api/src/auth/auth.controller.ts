import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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
// (Jwt payload handled by passport)
import { AccessTokenDto, ProvisionedUserDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import { TenantContextService } from '../tenant-context/tenant-context.service'
import { CreateRecruiterDto } from './dto/create-recruiter.dto'
import { CreateTenantAdminDto } from './dto/create-tenant-admin.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterCandidateDto } from './dto/register-candidate.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { Roles } from './rbac/roles.decorator'
import { CreateRecruiterUseCase } from './use-cases/create-recruiter.use-case'
import { CreateTenantAdminUseCase } from './use-cases/create-tenant-admin.use-case'
import { LoginUseCase } from './use-cases/login.use-case'
import { RegisterCandidateUseCase } from './use-cases/register-candidate.use-case'

interface RequestWithUser extends ExpressRequest {
  user: User
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
    private readonly tenantContext: TenantContextService,
  ) {}

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
    description: '`TENANT_ADMIN` + `X-Tenant-ID` do tenant que está convidando.',
  })
  @ApiCreatedResponse({ type: ProvisionedUserDto })
  @ApiStandardErrors(true)
  async createRecruiter(@Body() body: CreateRecruiterDto) {
    const tenantId = this.tenantContext.getTenantId()
    if (!tenantId) throw new BadRequestException('Missing X-Tenant-ID header')
    return this.createRecruiterUseCase.execute({ tenantId, ...body })
  }
}
