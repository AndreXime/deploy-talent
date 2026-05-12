import { IsEnum, IsOptional, IsUUID } from 'class-validator'
import { ApplicationStatus } from '../../../generated/prisma/client'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class TenantApplicationsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus

  @IsOptional()
  @IsUUID()
  jobId?: string
}

export class MyApplicationsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus
}
