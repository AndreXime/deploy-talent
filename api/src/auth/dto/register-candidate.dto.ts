import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class RegisterCandidateDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string
}
