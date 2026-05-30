import { Injectable, Logger } from '@nestjs/common'
import { EmailService } from './email.service'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface CandidateJobEmailContext {
  recipientEmail: string
  candidateName: string
  jobTitle: string
  companyName: string
}

export interface PipelineStageEmailContext {
  recipientEmail: string
  candidateName: string
  jobTitle: string
  companyName: string
  newStageName: string
  previousStageName: string | null
}

@Injectable()
export class CandidateApplicationEmailNotifier {
  private readonly logger = new Logger(CandidateApplicationEmailNotifier.name)

  constructor(private readonly email: EmailService) {}

  async notifyApplicationSubmitted(ctx: CandidateJobEmailContext): Promise<void> {
    const { recipientEmail, candidateName, jobTitle, companyName } = ctx
    const safe = {
      name: escapeHtml(candidateName),
      job: escapeHtml(jobTitle),
      company: escapeHtml(companyName),
    }
    const subject = `Candidatura recebida — ${jobTitle}`
    const text = [
      `Olá, ${candidateName},`,
      '',
      `Recebemos sua candidatura para a vaga "${jobTitle}" na ${companyName}.`,
      'A equipe de recrutamento irá analisar seu perfil e entrará em contato se houver seguimento.',
      '',
      'Obrigado pelo seu interesse.',
    ].join('\n')
    const html = `<p>Olá, ${safe.name},</p>
<p>Recebemos sua candidatura para a vaga <strong>${safe.job}</strong> na <strong>${safe.company}</strong>.</p>
<p>A equipe de recrutamento irá analisar seu perfil e entrará em contato se houver seguimento.</p>
<p>Obrigado pelo seu interesse.</p>`
    await this.sendSafe({ to: recipientEmail, subject, text, html })
  }

  async notifyHired(ctx: CandidateJobEmailContext): Promise<void> {
    const { recipientEmail, candidateName, jobTitle, companyName } = ctx
    const safe = {
      name: escapeHtml(candidateName),
      job: escapeHtml(jobTitle),
      company: escapeHtml(companyName),
    }
    const subject = `Parabéns — foi selecionado(a) para "${jobTitle}"`
    const text = [
      `Olá, ${candidateName},`,
      '',
      `Temos o prazer de informar que foi selecionado(a) para a vaga "${jobTitle}" na ${companyName}.`,
      'A equipe de recrutamento deverá entrar em contato em breve com os próximos passos.',
      '',
      'Parabéns e boa sorte nesta nova etapa.',
    ].join('\n')
    const html = `<p>Olá, ${safe.name},</p>
<p>Temos o prazer de informar que foi <strong>selecionado(a)</strong> para a vaga <strong>${safe.job}</strong> na <strong>${safe.company}</strong>.</p>
<p>A equipe de recrutamento deverá entrar em contato em breve com os próximos passos.</p>
<p>Parabéns e boa sorte nesta nova etapa.</p>`
    await this.sendSafe({ to: recipientEmail, subject, text, html })
  }

  async notifyRejected(ctx: CandidateJobEmailContext): Promise<void> {
    const { recipientEmail, candidateName, jobTitle, companyName } = ctx
    const safe = {
      name: escapeHtml(candidateName),
      job: escapeHtml(jobTitle),
      company: escapeHtml(companyName),
    }
    const subject = `Atualização da candidatura — ${jobTitle}`
    const text = [
      `Olá, ${candidateName},`,
      '',
      `Obrigado por se candidatar à vaga "${jobTitle}" na ${companyName}.`,
      'Após análise, neste momento não avançaremos com seu perfil para esta posição.',
      'Valorizamos o tempo que dedicou e desejamos a você sucesso na sua procura.',
      '',
      'Atenciosamente,',
      `Equipe de recrutamento — ${companyName}`,
    ].join('\n')
    const html = `<p>Olá, ${safe.name},</p>
<p>Obrigado por se candidatar à vaga <strong>${safe.job}</strong> na <strong>${safe.company}</strong>.</p>
<p>Após análise, neste momento <strong>não avançaremos</strong> com seu perfil para esta posição.</p>
<p>Valorizamos o tempo que dedicou e desejamos a você sucesso na sua procura.</p>
<p>Atenciosamente,<br/>Equipe de recrutamento — ${safe.company}</p>`
    await this.sendSafe({ to: recipientEmail, subject, text, html })
  }

  async notifyPipelineStageAdvanced(ctx: PipelineStageEmailContext): Promise<void> {
    const {
      recipientEmail,
      candidateName,
      jobTitle,
      companyName,
      newStageName,
      previousStageName,
    } = ctx
    const safe = {
      name: escapeHtml(candidateName),
      job: escapeHtml(jobTitle),
      company: escapeHtml(companyName),
      stage: escapeHtml(newStageName),
    }
    const subject = `Nova etapa na candidatura - ${jobTitle}`
    const transition =
      previousStageName !== null && previousStageName.length > 0
        ? `Sua candidatura passou da etapa "${previousStageName}" para "${newStageName}".`
        : `Sua candidatura avançou para a etapa "${newStageName}".`
    const text = [
      `Olá, ${candidateName},`,
      '',
      transition,
      '',
      `Vaga: "${jobTitle}" na ${companyName}.`,
      'Pode acompanhar o que falta fazer na área do candidato na plataforma.',
      '',
      'Atenciosamente,',
      `Equipe de recrutamento - ${companyName}`,
    ].join('\n')
    const prevHtml =
      previousStageName !== null && previousStageName.length > 0
        ? `<p>Sua candidatura passou da etapa <strong>${escapeHtml(previousStageName)}</strong> para <strong>${safe.stage}</strong>.</p>`
        : `<p>Sua candidatura avançou para a etapa <strong>${safe.stage}</strong>.</p>`
    const html = `<p>Olá, ${safe.name},</p>
${prevHtml}
<p>Vaga: <strong>${safe.job}</strong> na <strong>${safe.company}</strong>.</p>
<p>Pode acompanhar o que falta fazer na área do candidato na plataforma.</p>
<p>Atenciosamente,<br/>Equipe de recrutamento - ${safe.company}</p>`
    await this.sendSafe({ to: recipientEmail, subject, text, html })
  }

  private async sendSafe(input: {
    to: string
    subject: string
    text: string
    html: string
  }): Promise<void> {
    try {
      await this.email.send(input)
    } catch (err) {
      this.logger.warn(
        `Candidate notification email skipped after failure: ${input.subject}`,
        err as Error,
      )
    }
  }
}
