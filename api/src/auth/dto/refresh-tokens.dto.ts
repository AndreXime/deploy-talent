import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class RefreshTokensDto {
  @ApiProperty({ description: 'Refresh opaco devolvido no login ou registo' })
  @IsString()
  @MinLength(20)
  refresh_token!: string
}
