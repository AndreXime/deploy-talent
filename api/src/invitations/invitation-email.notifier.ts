import { Injectable, Logger } from '@nestjs/common'
import { EmailService } from '../infra/email/email.service'
import { EnvService } from '../infra/env/env.service'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface TenantAdminInvitationEmailContext {
  recipientEmail: string
  tenantName: string
  inviterName: string | null
  rawToken: string
  expiresAt: Date
}

@Injectable()
export class InvitationEmailNotifier {
  private readonly logger = new Logger(InvitationEmailNotifier.name)

  constructor(
    private readonly email: EmailService,
    private readonly env: EnvService,
  ) {}

  async notifyTenantAdminInvited(ctx: TenantAdminInvitationEmailContext): Promise<void> {
    const { recipientEmail, tenantName, inviterName, rawToken, expiresAt } = ctx
    const activationUrl = `${this.env.webBaseUrl}/ativar/${encodeURIComponent(rawToken)}`
    const inviter = inviterName ?? 'a equipa Deploy Talent'
    const expires = expiresAt.toLocaleString('pt-PT', {
      dateStyle: 'long',
      timeStyle: 'short',
    })

    const safe = {
      tenant: escapeHtml(tenantName),
      inviter: escapeHtml(inviter),
      url: escapeHtml(activationUrl),
      expires: escapeHtml(expires),
    }

    const subject = `Convite para administrar ${tenantName} no Deploy Talent`
    const text = [
      'Olá,',
      '',
      `${inviter} convidou para administrar a empresa "${tenantName}" no Deploy Talent.`,
      '',
      'Para activar a conta e definir a sua palavra passe, abra:',
      activationUrl,
      '',
      `Este link expira a ${expires} e só pode ser usado uma vez.`,
      'Se não esperava este convite, ignore esta mensagem.',
    ].join('\n')

    const html = `<p>Olá,</p>
<p><strong>${safe.inviter}</strong> convidou para administrar a empresa <strong>${safe.tenant}</strong> no Deploy Talent.</p>
<p>Para activar a conta e definir a sua palavra passe, abra o link abaixo:</p>
<p><a href="${safe.url}">${safe.url}</a></p>
<p>Este link expira a <strong>${safe.expires}</strong> e só pode ser usado uma vez.</p>
<p>Se não esperava este convite, ignore esta mensagem.</p>`

    try {
      await this.email.send({ to: recipientEmail, subject, text, html })
    } catch (err) {
      this.logger.error(
        `Falha ao enviar convite para ${recipientEmail} (tenant ${tenantName})`,
        err as Error,
      )
      throw err
    }
  }
}
