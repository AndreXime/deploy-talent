import {
  type CallHandler,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { from, mergeMap, Observable } from 'rxjs'
import type { PrismaClient } from '../../generated/prisma/client'
import { UserRole } from '../../generated/prisma/client'
import type { JwtPayload } from '../auth/jwt-payload'
import { PRISMA_CLIENT } from '../infra/prisma/prisma.constants'
import { IS_TENANT_REQUIRED } from './tenant.decorators'
import { TenantContextService } from './tenant-context.service'

type RequestWithUser = Request & { user?: JwtPayload }

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return from(this.wrapWithTenant(context, next)).pipe(mergeMap((o) => o))
  }

  private async wrapWithTenant(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const required =
      this.reflector.getAllAndOverride<boolean>(IS_TENANT_REQUIRED, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false

    const req = context.switchToHttp().getRequest<RequestWithUser>()
    const resolved = this.resolveTenantId(req)

    if (required && (resolved === null || resolved === '')) {
      throw new ForbiddenException('Missing tenant context')
    }

    if (resolved === null || resolved === '') {
      return next.handle()
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: resolved, deletedAt: null, isActive: true, signupPending: false },
      select: { id: true },
    })
    if (!tenant) {
      throw new ForbiddenException('Invalid or inactive tenant')
    }

    return new Observable((subscriber) => {
      this.tenantContext.runWithTenant(resolved, () => {
        next.handle().subscribe(subscriber)
      })
    })
  }

  private resolveTenantId(req: RequestWithUser): string | null {
    const user = req.user
    if (user?.role === UserRole.TENANT_ADMIN || user?.role === UserRole.RECRUITER) {
      return user.tenantId ?? null
    }
    if (user?.role === UserRole.CANDIDATE) {
      const fromParam = req.params?.tenantId
      if (typeof fromParam === 'string') {
        const t = fromParam.trim()
        return t.length > 0 ? t : null
      }
      return null
    }
    const fromParam = req.params?.tenantId
    if (typeof fromParam === 'string') {
      const t = fromParam.trim()
      return t.length > 0 ? t : null
    }
    return null
  }
}
