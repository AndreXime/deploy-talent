import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class SaveJobDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador da vaga (`Job.id`).' })
  @IsUUID()
  jobId!: string
}
