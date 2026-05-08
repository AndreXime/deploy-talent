import { IsEnum, IsOptional } from 'class-validator'
import { ApplicationStatus } from '../../../generated/prisma/client'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class TenantApplicationsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus
}

export class MyApplicationsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus
}
