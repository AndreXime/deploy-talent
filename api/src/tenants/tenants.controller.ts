import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import { UserRole } from '../../generated/prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../auth/rbac/roles.decorator'
import { TenantResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional } from '../tenant-context/tenant.decorators'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { ActivateTenantUseCase } from './use-cases/activate-tenant.use-case'
import { CreateTenantUseCase } from './use-cases/create-tenant.use-case'
import { ListTenantsUseCase } from './use-cases/list-tenants.use-case'
import { SoftDeleteTenantUseCase } from './use-cases/soft-delete-tenant.use-case'
import { SuspendTenantUseCase } from './use-cases/suspend-tenant.use-case'

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
    private readonly softDeleteTenant: SoftDeleteTenantUseCase,
  ) {}

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

  @Patch(':id/delete')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Soft-delete do tenant',
    description: 'Preenche `deletedAt`, desativa o tenant e deve bloquear uso em rotas tenant-scoped.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TenantResponseDto })
  async softDelete(@Param('id') id: string) {
    return this.softDeleteTenant.execute(id)
  }
}
