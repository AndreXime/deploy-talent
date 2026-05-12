import { IsEmail, MaxLength } from 'class-validator'

export class InviteRecruiterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string
}
