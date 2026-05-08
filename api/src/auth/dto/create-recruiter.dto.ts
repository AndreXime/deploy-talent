import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateRecruiterDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string
}
