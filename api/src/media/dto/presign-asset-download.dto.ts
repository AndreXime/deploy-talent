import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class PresignAssetDownloadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  key!: string
}
