import { IsUUID } from 'class-validator'

export class ListEvaluationsQueryDto {
  @IsUUID()
  applicationId!: string
}
