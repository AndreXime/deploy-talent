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

export interface RecruiterInvitationEmailContext {
  recipientEmail: string
  tenantName: string
  inviterName: string | null
  rawToken: string
  expiresAt: Date
}

export interface CandidateSourcingInvitationEmailContext {
  recipientEmail: string
  recipientName: string
  tenantName: string
  jobTitle: string
  jobUrl: string
  rawToken: string
  expiresAt: Date
}

export interface CandidateJobNudgeEmailContext {
  recipientEmail: string
  tenantName: string
  jobTitle: string
  jobUrl: string
}

interface RenderedInvitationEmail {
  subject: string
  text: string
  html: string
}

@Injectable()
export class InvitationEmailNotifier {
  private readonly logger = new Logger(InvitationEmailNotifier.name)

  constructor(
    private readonly email: EmailService,
    private readonly env: EnvService,
  ) {}

  async notifyTenantAdminInvited(ctx: TenantAdminInvitationEmailContext): Promise<void> {
    const rendered = this.renderTenantAdminEmail(ctx)
    await this.dispatch(ctx.recipientEmail, ctx.tenantName, rendered)
  }

  async notifyRecruiterInvited(ctx: RecruiterInvitationEmailContext): Promise<void> {
    const rendered = this.renderRecruiterEmail(ctx)
    await this.dispatch(ctx.recipientEmail, ctx.tenantName, rendered)
  }

  async notifyCandidateSourcedForJob(ctx: CandidateSourcingInvitationEmailContext): Promise<void> {
    const rendered = this.renderCandidateSourcingEmail(ctx)
    await this.dispatch(ctx.recipientEmail, ctx.tenantName, rendered)
  }

  async notifyCandidateNudgedForJob(ctx: CandidateJobNudgeEmailContext): Promise<void> {
    const rendered = this.renderCandidateNudgeEmail(ctx)
    await this.dispatch(ctx.recipientEmail, ctx.tenantName, rendered)
  }

  private renderTenantAdminEmail(ctx: TenantAdminInvitationEmailContext): RenderedInvitationEmail {
    const { tenantName, inviterName, rawToken, expiresAt } = ctx
    const activationUrl = this.buildActivationUrl(rawToken)
    const inviter = inviterName ?? 'a equipa Deploy Talent'
    const expires = this.formatExpiry(expiresAt)
    const safe = {
      tenant: escapeHtml(tenantName),
      inviter: escapeHtml(inviter),
      url: escapeHtml(activationUrl),
      expires: escapeHtml(expires),
    }

    return {
      subject: `Convite para administrar ${tenantName} no Deploy Talent`,
      text: [
        'Olá,',
        '',
        `${inviter} convidou para administrar a empresa "${tenantName}" no Deploy Talent.`,
        '',
        'Para activar a conta e definir a sua palavra passe, abra:',
        activationUrl,
        '',
        `Este link expira a ${expires} e só pode ser usado uma vez.`,
        'Se não esperava este convite, ignore esta mensagem.',
      ].join('\n'),
      html: `<p>Olá,</p>
<p><strong>${safe.inviter}</strong> convidou para administrar a empresa <strong>${safe.tenant}</strong> no Deploy Talent.</p>
<p>Para activar a conta e definir a sua palavra passe, abra o link abaixo:</p>
<p><a href="${safe.url}">${safe.url}</a></p>
<p>Este link expira a <strong>${safe.expires}</strong> e só pode ser usado uma vez.</p>
<p>Se não esperava este convite, ignore esta mensagem.</p>`,
    }
  }

  private renderRecruiterEmail(ctx: RecruiterInvitationEmailContext): RenderedInvitationEmail {
    const { tenantName, inviterName, rawToken, expiresAt } = ctx
    const activationUrl = this.buildActivationUrl(rawToken)
    const inviter = inviterName ?? `a equipa de ${tenantName}`
    const expires = this.formatExpiry(expiresAt)
    const safe = {
      tenant: escapeHtml(tenantName),
      inviter: escapeHtml(inviter),
      url: escapeHtml(activationUrl),
      expires: escapeHtml(expires),
    }

    return {
      subject: `Convite para integrar a equipa de ${tenantName} no Deploy Talent`,
      text: [
        'Olá,',
        '',
        `${inviter} convidou para integrar a equipa de recrutamento da empresa "${tenantName}" no Deploy Talent.`,
        '',
        'Para activar a conta de recrutador e definir a sua palavra passe, abra:',
        activationUrl,
        '',
        `Este link expira a ${expires} e só pode ser usado uma vez.`,
        'Se não esperava este convite, ignore esta mensagem.',
      ].join('\n'),
      html: `<p>Olá,</p>
<p><strong>${safe.inviter}</strong> convidou para integrar a equipa de recrutamento da empresa <strong>${safe.tenant}</strong> no Deploy Talent.</p>
<p>Para activar a conta de recrutador e definir a sua palavra passe, abra o link abaixo:</p>
<p><a href="${safe.url}">${safe.url}</a></p>
<p>Este link expira a <strong>${safe.expires}</strong> e só pode ser usado uma vez.</p>
<p>Se não esperava este convite, ignore esta mensagem.</p>`,
    }
  }

  private renderCandidateSourcingEmail(
    ctx: CandidateSourcingInvitationEmailContext,
  ): RenderedInvitationEmail {
    const { tenantName, jobTitle, jobUrl, rawToken, expiresAt, recipientName } = ctx
    const activationUrl = this.buildActivationUrl(rawToken)
    const expires = this.formatExpiry(expiresAt)
    const safe = {
      name: escapeHtml(recipientName),
      tenant: escapeHtml(tenantName),
      job: escapeHtml(jobTitle),
      jobUrl: escapeHtml(jobUrl),
      activation: escapeHtml(activationUrl),
      expires: escapeHtml(expires),
    }

    return {
      subject: `${tenantName} convidou para a vaga ${jobTitle} no Deploy Talent`,
      text: [
        `Olá ${recipientName},`,
        '',
        `A equipa de recrutamento de "${tenantName}" identificou o seu perfil para a vaga "${jobTitle}" no Deploy Talent.`,
        '',
        'Para criar conta de candidato e definir a sua palavra passe, abra:',
        activationUrl,
        '',
        'Depois de activar a conta poderá rever a descrição da vaga em:',
        jobUrl,
        '',
        `Este link de activação expira a ${expires} e só pode ser usado uma vez.`,
        'Se não esperava este convite, ignore esta mensagem.',
      ].join('\n'),
      html: `<p>Olá <strong>${safe.name}</strong>,</p>
<p>A equipa de recrutamento de <strong>${safe.tenant}</strong> identificou o seu perfil para a vaga <strong>${safe.job}</strong> no Deploy Talent.</p>
<p>Para criar conta de candidato e definir a sua palavra passe, abra o link abaixo:</p>
<p><a href="${safe.activation}">${safe.activation}</a></p>
<p>Depois de activar a conta poderá rever a descrição da vaga em:</p>
<p><a href="${safe.jobUrl}">${safe.jobUrl}</a></p>
<p>Este link de activação expira a <strong>${safe.expires}</strong> e só pode ser usado uma vez.</p>
<p>Se não esperava este convite, ignore esta mensagem.</p>`,
    }
  }

  private renderCandidateNudgeEmail(ctx: CandidateJobNudgeEmailContext): RenderedInvitationEmail {
    const { tenantName, jobTitle, jobUrl } = ctx
    const safe = {
      tenant: escapeHtml(tenantName),
      job: escapeHtml(jobTitle),
      jobUrl: escapeHtml(jobUrl),
    }

    return {
      subject: `${tenantName} tem uma vaga em aberto: ${jobTitle}`,
      text: [
        'Olá,',
        '',
        `A equipa de recrutamento de "${tenantName}" identificou o seu perfil para a vaga "${jobTitle}" no Deploy Talent.`,
        '',
        'Como já tem conta de candidato na plataforma, basta abrir o link abaixo e candidatar se directamente:',
        jobUrl,
        '',
        'Se não tem interesse, ignore esta mensagem.',
      ].join('\n'),
      html: `<p>Olá,</p>
<p>A equipa de recrutamento de <strong>${safe.tenant}</strong> identificou o seu perfil para a vaga <strong>${safe.job}</strong> no Deploy Talent.</p>
<p>Como já tem conta de candidato na plataforma, basta abrir o link abaixo e candidatar se directamente:</p>
<p><a href="${safe.jobUrl}">${safe.jobUrl}</a></p>
<p>Se não tem interesse, ignore esta mensagem.</p>`,
    }
  }

  private buildActivationUrl(rawToken: string): string {
    return `${this.env.webBaseUrl}/ativar/${encodeURIComponent(rawToken)}`
  }

  private formatExpiry(expiresAt: Date): string {
    return expiresAt.toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' })
  }

  private async dispatch(
    recipientEmail: string,
    tenantName: string,
    rendered: RenderedInvitationEmail,
  ): Promise<void> {
    try {
      await this.email.send({
        to: recipientEmail,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      })
    } catch (err) {
      this.logger.error(
        `Falha ao enviar convite para ${recipientEmail} (tenant ${tenantName})`,
        err as Error,
      )
      throw err
    }
  }
}
