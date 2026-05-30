import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import { UserRole } from '../../generated/prisma/client'
import type { Actor } from '../applications/use-cases/application.actor'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/jwt-payload'
import { Roles } from '../auth/rbac/roles.decorator'
import { TenantRecruiterItemDto, TenantResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { UpdateTenantBrandingDto } from './dto/update-tenant-branding.dto'
import { ActivateTenantUseCase } from './use-cases/activate-tenant.use-case'
import { ApproveTenantSignupUseCase } from './use-cases/approve-tenant-signup.use-case'
import { CreateTenantUseCase } from './use-cases/create-tenant.use-case'
import { GetCurrentTenantUseCase } from './use-cases/get-current-tenant.use-case'
import { ListCurrentTenantRecruitersUseCase } from './use-cases/list-current-tenant-recruiters.use-case'
import { ListTenantsUseCase } from './use-cases/list-tenants.use-case'
import { RejectTenantSignupUseCase } from './use-cases/reject-tenant-signup.use-case'
import { RemoveTenantRecruiterUseCase } from './use-cases/remove-tenant-recruiter.use-case'
import { SoftDeleteTenantUseCase } from './use-cases/soft-delete-tenant.use-case'
import { SuspendTenantUseCase } from './use-cases/suspend-tenant.use-case'
import { UpdateTenantBrandingUseCase } from './use-cases/update-tenant-branding.use-case'

interface RequestWithJwt extends ExpressRequest {
  user?: JwtPayload
}

function requireUser(req: RequestWithJwt): JwtPayload {
  const user = req.user
  if (!user) throw new ForbiddenException('Missing authentication')
  return user
}

@Controller('tenants')
@ApiTags('Tenants')
@ApiJwtAuth()
@ApiStandardErrors(true)
@TenantOptional()
export class TenantsController {
  constructor(
    private readonly createTenant: CreateTenantUseCase,
    private readonly listTenants: ListTenantsUseCase,
    private readonly suspendTenant: SuspendTenantUseCase,
    private readonly activateTenant: ActivateTenantUseCase,
    private readonly approveTenantSignup: ApproveTenantSignupUseCase,
    private readonly rejectTenantSignup: RejectTenantSignupUseCase,
    private readonly softDeleteTenant: SoftDeleteTenantUseCase,
    private readonly updateTenantBranding: UpdateTenantBrandingUseCase,
    private readonly getCurrentTenant: GetCurrentTenantUseCase,
    private readonly listCurrentTenantRecruiters: ListCurrentTenantRecruitersUseCase,
    private readonly removeTenantRecruiter: RemoveTenantRecruiterUseCase,
  ) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Empresa do usuário autenticado',
    description: 'Retorna a empresa correspondente ao `tenantId` do JWT.',
  })
  @ApiOkResponse({ type: TenantResponseDto })
  async current() {
    return this.getCurrentTenant.execute()
  }

  @Get('current/recruiters')
  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Listar recrutadores da empresa atual',
    description:
      'Apenas `TENANT_ADMIN`. Retorna os usuárioes com papel `RECRUITER` no tenant do JWT, ordenados por antiguidade, com `avatarUrl` assinado.',
  })
  @ApiOkResponse({ type: TenantRecruiterItemDto, isArray: true })
  async currentRecruiters() {
    return this.listCurrentTenantRecruiters.execute()
  }

  @Delete('current/recruiters/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Remover recrutador da empresa atual',
    description:
      'Apenas `TENANT_ADMIN`. Apaga o usuário. Histórico de candidaturas, transições e avaliações preserva os registros com a referência ao autor a `null` (ON DELETE SET NULL).',
  })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiNoContentResponse()
  async removeCurrentRecruiter(
    @Request() req: RequestWithJwt,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    const user = requireUser(req)
    await this.removeTenantRecruiter.execute(user.sub, userId)
  }

  @Patch('current/branding')
  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN, UserRole.RECRUITER)
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Atualizar logo e/ou banner da empresa',
    description:
      'Use `POST /media/presign-upload` com `TENANT_LOGO` ou `TENANT_BANNER`, faça PUT no S3 e envie as `key` aqui. String vazia remove a mídia.',
  })
  @ApiBody({ type: UpdateTenantBrandingDto })
  @ApiOkResponse({ type: TenantResponseDto })
  async patchCurrentBranding(
    @Request() req: RequestWithJwt,
    @Body() body: UpdateTenantBrandingDto,
  ) {
    const user = requireUser(req)
    const actor: Actor = { userId: user.sub, role: user.role as UserRole }
    return this.updateTenantBranding.execute(actor, body)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Criar empresa (tenant)' })
  @ApiBody({ type: CreateTenantDto })
  @ApiCreatedResponse({ type: TenantResponseDto })
  async create(@Body() body: CreateTenantDto) {
    return this.createTenant.execute(body)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar tenants da plataforma' })
  @ApiOkResponse({ type: TenantResponseDto, isArray: true })
  async list() {
    return this.listTenants.execute()
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspender tenant (isActive=false)' })
  @ApiParam({ name: 'id', format: 'uuid', description: '`Tenant.id`' })
  @ApiOkResponse({ type: TenantResponseDto })
  async suspend(@Param('id') id: string) {
    return this.suspendTenant.execute(id)
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reativar tenant' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TenantResponseDto })
  async activate(@Param('id') id: string) {
    return this.activateTenant.execute(id)
  }

  @Patch(':id/approve-signup')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Aprovar cadastro público de empresa',
    description: 'Activa o tenant e remove `signupPending` (admin já pode entrar em `/entrar`).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TenantResponseDto })
  async approveSignup(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.approveTenantSignup.execute(id)
  }

  @Patch(':id/reject-signup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Recusar cadastro público de empresa',
    description: 'Apaga o tenant e o usuário TENANT_ADMIN associado (slug fica livre).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async rejectSignup(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.rejectTenantSignup.execute(id)
  }

  @Patch(':id/delete')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Soft-delete do tenant',
    description:
      'Preenche `deletedAt`, desativa o tenant e deve bloquear uso em rotas tenant-scoped.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TenantResponseDto })
  async softDelete(@Param('id') id: string) {
    return this.softDeleteTenant.execute(id)
  }
}
