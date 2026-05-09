import { Injectable, Logger } from '@nestjs/common'
import nodemailer from 'nodemailer'
import { EnvService } from '../env/env.service'
import { normalizeRecipients } from './email.constants'

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string | string[]
  from?: string
}

export interface SentEmail {
  messageId: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly transporter

  constructor(private readonly env: EnvService) {
    this.transporter = nodemailer.createTransport({
      host: this.env.smtpHost,
      port: this.env.smtpPort,
      secure: this.env.smtpSecure,
      auth:
        this.env.smtpUser !== null && this.env.smtpPassword !== null
          ? { user: this.env.smtpUser, pass: this.env.smtpPassword }
          : undefined,
    })
  }

  async send(input: SendEmailInput): Promise<SentEmail> {
    if (!input.html && !input.text) {
      throw new Error('Email body must include html or text content')
    }

    const toRaw = normalizeRecipients(input.to)
    if (toRaw.length === 0) throw new Error('Email must have at least one "to" recipient')

    const to = toRaw.join(', ')
    const cc = normalizeRecipients(input.cc)
    const bcc = normalizeRecipients(input.bcc)
    const replyToRaw = normalizeRecipients(input.replyTo ?? this.env.emailReplyTo ?? undefined)
    const replyTo = replyToRaw.length > 0 ? replyToRaw.join(', ') : undefined

    try {
      const info = await this.transporter.sendMail({
        from: input.from ?? this.env.emailFrom,
        to,
        cc: cc.length > 0 ? cc.join(', ') : undefined,
        bcc: bcc.length > 0 ? bcc.join(', ') : undefined,
        replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
      })
      const messageId =
        typeof info.messageId === 'string' ? info.messageId : String(info.messageId ?? '')
      this.logger.log(`Email sent to ${to} (messageId=${messageId})`)
      return { messageId }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err as Error)
      throw err
    }
  }
}
