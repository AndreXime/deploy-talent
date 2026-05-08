import { IsEnum } from 'class-validator'
import { JobStatus } from '../../../generated/prisma/client'

export class ChangeJobStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus
}
