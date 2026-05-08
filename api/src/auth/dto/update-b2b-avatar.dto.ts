import { IsString, MaxLength } from 'class-validator'

export class UpdateB2BAvatarDto {
  /** Envie string vazia para remover a foto. */
  @IsString()
  @MaxLength(512)
  avatarKey!: string
}
