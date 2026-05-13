import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import { UserRole } from '../../generated/prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/jwt-payload'
import { Public } from '../auth/public.decorator'
import { Roles } from '../auth/rbac/roles.decorator'
import {
  AccessTokenDto,
  CreatedInvitationDto,
  InvitationPreviewDto,
} from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiJwtTenantB2b, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional, TenantRequired } from '../tenant-context/tenant.decorators'
import { AcceptInvitationDto } from './dto/accept-invitation.dto'
import { InviteRecruiterDto } from './dto/invite-recruiter.dto'
import { InviteTenantAdminDto } from './dto/invite-tenant-admin.dto'
import { AcceptInvitationUseCase } from './use-cases/accept-invitation.use-case'
import { GetInvitationByTokenUseCase } from './use-cases/get-invitation-by-token.use-case'
import { InviteRecruiterUseCase } from './use-cases/invite-recruiter.use-case'
import { InviteTenantAdminUseCase } from './use-cases/invite-tenant-admin.use-case'

interface RequestWithJwt extends ExpressRequest {
  user?: JwtPayload
}

@Controller('invitations')
@ApiTags('Invitations')
@TenantOptional()
export class InvitationsController {
  constructor(
    private readonly inviteTenantAdmin: InviteTenantAdminUseCase,
    private readonly inviteRecruiter: InviteRecruiterUseCase,
    private readonly getInvitation: GetInvitationByTokenUseCase,
    private readonly acceptInvitation: AcceptInvitationUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('tenant-admin')
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Convidar admin de uma empresa',
    description:
      'Apenas `SUPER_ADMIN`. Gera um token único e envia link de ativação por email; o destinatário define a senha ao aceitar o convite.',
  })
  @ApiBody({ type: InviteTenantAdminDto })
  @ApiCreatedResponse({ type: CreatedInvitationDto })
  @ApiStandardErrors(true)
  async createTenantAdminInvite(
    @Body() body: InviteTenantAdminDto,
    @Request() req: RequestWithJwt,
  ) {
    const user = req.user
    if (!user) throw new ForbiddenException('Missing authentication')
    return this.inviteTenantAdmin.execute({
      tenantId: body.tenantId,
      email: body.email,
      invitedByUserId: user.sub,
    })
  }

  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @Roles(UserRole.TENANT_ADMIN)
  @Post('recruiter')
  @ApiJwtTenantB2b()
  @ApiOperation({
    summary: 'Convidar recrutador para a empresa atual',
    description:
      'Apenas `TENANT_ADMIN`; o tenant vem do JWT. Gera um token único e envia link de ativação por email; o destinatário define a senha ao aceitar o convite.',
  })
  @ApiBody({ type: InviteRecruiterDto })
  @ApiCreatedResponse({ type: CreatedInvitationDto })
  @ApiStandardErrors(true)
  async createRecruiterInvite(@Body() body: InviteRecruiterDto, @Request() req: RequestWithJwt) {
    const user = req.user
    if (!user) throw new ForbiddenException('Missing authentication')
    return this.inviteRecruiter.execute({
      email: body.email,
      invitedByUserId: user.sub,
    })
  }

  @Public()
  @Get(':token')
  @ApiOperation({
    summary: 'Préviaizar um convite a partir do token',
    description:
      'Endpoint público usado pela página de ativação para mostrar o email e a empresa associados ao convite. Não devolve nem aceita senhas.',
  })
  @ApiOkResponse({ type: InvitationPreviewDto })
  async preview(@Param('token') token: string) {
    return this.getInvitation.execute(token)
  }

  @Public()
  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceitar convite e ativar a conta',
    description:
      'Endpoint público. Cria o usuário com a senha definida pelo destinatário, invalida o convite e devolve um JWT pronto a usar.',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiOkResponse({ type: AccessTokenDto })
  @ApiStandardErrors(true)
  async accept(@Param('token') token: string, @Body() body: AcceptInvitationDto) {
    return this.acceptInvitation.execute(token, body.password)
  }
}
