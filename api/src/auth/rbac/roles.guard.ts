import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { UserRole } from '../../../generated/prisma/client'
import type { JwtPayload } from '../jwt-payload'
import { ROLES_KEY } from './roles.decorator'

interface RequestWithUser extends Request {
  user?: JwtPayload
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? []

    if (roles.length === 0) return true

    const req = context.switchToHttp().getRequest<RequestWithUser>()
    const user = req.user
    if (!user) throw new ForbiddenException('Missing authentication')

    if (roles.includes(user.role as UserRole)) return true
    throw new ForbiddenException('Insufficient role')
  }
}
