import { IsUUID } from 'class-validator'

export class MoveApplicationStageDto {
  @IsUUID()
  jobStageId!: string
}
