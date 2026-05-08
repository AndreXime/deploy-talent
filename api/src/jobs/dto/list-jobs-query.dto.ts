import { IsEnum, IsOptional } from 'class-validator'
import { JobStatus } from '../../../generated/prisma/client'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class ListJobsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus
}
