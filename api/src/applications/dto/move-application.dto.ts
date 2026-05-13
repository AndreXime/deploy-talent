import { IsEnum } from 'class-validator'
import { ApplicationStatus } from '../../../generated/prisma/client'

export class MoveApplicationDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus
}
