import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { Injectable, Logger } from '@nestjs/common'
import { EnvService } from '../env/env.service'
import { EMAIL_CHARSET, normalizeRecipients } from './email.constants'

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
  private readonly client: SESv2Client

  constructor(private readonly env: EnvService) {
    this.client = new SESv2Client({
      region: this.env.awsRegion,
      endpoint: this.env.emailEndpoint ?? undefined,
      credentials:
        this.env.emailAccessKeyId !== null && this.env.emailSecretAccessKey !== null
          ? {
              accessKeyId: this.env.emailAccessKeyId,
              secretAccessKey: this.env.emailSecretAccessKey,
            }
          : undefined,
    })
  }

  async send(input: SendEmailInput): Promise<SentEmail> {
    if (!input.html && !input.text) {
      throw new Error('Email body must include html or text content')
    }

    const to = normalizeRecipients(input.to)
    if (to.length === 0) throw new Error('Email must have at least one "to" recipient')

    const replyTo = normalizeRecipients(input.replyTo ?? this.env.emailReplyTo ?? undefined)

    const command = new SendEmailCommand({
      FromEmailAddress: input.from ?? this.env.emailFrom,
      Destination: {
        ToAddresses: to,
        CcAddresses: normalizeRecipients(input.cc),
        BccAddresses: normalizeRecipients(input.bcc),
      },
      ReplyToAddresses: replyTo.length > 0 ? replyTo : undefined,
      ConfigurationSetName: this.env.emailConfigurationSet ?? undefined,
      Content: {
        Simple: {
          Subject: { Data: input.subject, Charset: EMAIL_CHARSET },
          Body: {
            Html: input.html ? { Data: input.html, Charset: EMAIL_CHARSET } : undefined,
            Text: input.text ? { Data: input.text, Charset: EMAIL_CHARSET } : undefined,
          },
        },
      },
    })

    try {
      const response = await this.client.send(command)
      const messageId = response.MessageId ?? ''
      this.logger.log(`Email sent to ${to.join(', ')} (messageId=${messageId})`)
      return { messageId }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to.join(', ')}`, err as Error)
      throw err
    }
  }
}
