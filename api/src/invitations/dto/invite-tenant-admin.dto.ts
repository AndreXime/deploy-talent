import { IsEmail, IsUUID, MaxLength } from 'class-validator'

export class InviteTenantAdminDto {
  @IsUUID()
  tenantId!: string

  @IsEmail()
  @MaxLength(254)
  email!: string
}
