import { Body, Controller, ForbiddenException, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import { UserRole } from '../../generated/prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/jwt-payload'
import { Roles } from '../auth/rbac/roles.decorator'
import { ApplicationResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantRequired } from '../tenant-context/tenant.decorators'
import { ApplyDto } from './dto/apply.dto'
import { ApplyToJobUseCase } from './use-cases/apply-to-job.use-case'

interface RequestWithUser extends ExpressRequest {
  user?: JwtPayload
}

function requireUser(req: RequestWithUser): JwtPayload {
  const user = req.user
  if (!user) throw new ForbiddenException('Missing authentication')
  return user
}

@Controller('tenants/:tenantId/applications')
@ApiTags('Applications')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.CANDIDATE)
@ApiJwtAuth()
export class TenantCandidateApplicationsController {
  constructor(private readonly applyToJob: ApplyToJobUseCase) {}

  @Post('apply')
  @TenantRequired()
  @ApiOperation({
    summary: 'Candidatar-se a uma vaga publicada ou pausada',
    description: '`CANDIDATE` + UUID do tenant na URL (empresa à qual se candidata).',
  })
  @ApiParam({ name: 'tenantId', format: 'uuid', description: '`Tenant.id` da empresa' })
  @ApiBody({ type: ApplyDto })
  @ApiCreatedResponse({ type: ApplicationResponseDto })
  @ApiStandardErrors(true)
  async apply(@Request() req: RequestWithUser, @Body() body: ApplyDto) {
    const user = requireUser(req)
    return this.applyToJob.execute({ userId: user.sub, role: user.role as UserRole }, body)
  }
}
