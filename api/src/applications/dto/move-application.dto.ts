import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { ApplicationStatus } from '../../../generated/prisma/client'

export class MoveApplicationDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus

  @IsOptional()
  @IsString()
  @MaxLength(80)
  stage?: string
}
