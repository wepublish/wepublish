import {MailLogState, PrismaClient} from '@prisma/client'
import Email from 'email-templates'
import {logger} from '../server'
import {BaseMailProvider} from './mailProvider'

export enum SendMailType {
  LoginLink,
  TestMail,
  PasswordReset,
  NewMemberSubscription,
  RenewedMemberSubscription,
  MemberSubscriptionOffSessionBefore,
  MemberSubscriptionOnSessionBefore,
  MemberSubscriptionOnSessionAfter,
  MemberSubscriptionOffSessionFailed
}

export interface SendEMailProps {
  readonly type: SendMailType
  readonly recipient: string
  readonly data: Record<string, any>
}

export interface MailTemplateMap {
  type: SendMailType
  subject?: string
  fromAddress?: string
  replyToAddress?: string
  local: boolean
  localTemplate?: string
  remoteTemplate?: string
}

export interface MailContextOptions {
  readonly defaultFromAddress: string
  readonly defaultReplyToAddress?: string
  readonly mailTemplateMaps: MailTemplateMap[]
  readonly mailTemplatesPath?: string
}

export interface MailContext {
  mailProvider: BaseMailProvider | null
  prisma: PrismaClient

  email: Email
  mailTemplateMaps: MailTemplateMap[]

  defaultFromAddress: string
  defaultReplyToAddress?: string

  sendMail(props: SendEMailProps): Promise<void>
}

export interface MailContextProps extends MailContextOptions {
  readonly mailProvider?: BaseMailProvider
  readonly prisma: PrismaClient
}

export class MailContext implements MailContext {
  mailProvider: BaseMailProvider | null

  email: Email

  mailTemplateMaps: MailTemplateMap[]

  defaultFromAddress: string
  defaultReplyToAddress?: string

  constructor(props: MailContextProps) {
    this.mailProvider = props.mailProvider ?? null
    this.prisma = props.prisma

    this.defaultFromAddress = props.defaultFromAddress
    this.defaultReplyToAddress = props.defaultReplyToAddress

    this.email = new Email({
      send: false,
      // textOnly: true,
      views: {
        root: props.mailTemplatesPath
      }
    })

    this.mailTemplateMaps = props.mailTemplateMaps ?? []
  }

  async sendMail({type, recipient, data}: SendEMailProps): Promise<void> {
    // const type = SendMailType.LoginLink
    const mailTemplate = this.mailTemplateMaps.find(template => template.type === type)
    if (!mailTemplate) {
      logger('mailContext').warn(`Template for type: ${type} not found`)
      return
    }

    const mailView =
      mailTemplate.local && mailTemplate.localTemplate
        ? await this.email.renderAll(mailTemplate.localTemplate, data)
        : undefined

    const mailLog = await this.prisma.mailLog.create({
      data: {
        state: MailLogState.submitted,
        subject: mailView?.subject ?? mailTemplate.subject ?? 'N/A',
        recipient,
        mailProviderID: this.mailProvider?.id ?? 'N/A',
        modifiedAt: new Date()
      }
    })

    if (this.mailProvider) {
      await this.mailProvider.sendMail({
        mailLogID: mailLog.id,
        recipient,
        replyToAddress:
          mailTemplate.replyToAddress ?? this.defaultReplyToAddress ?? this.defaultFromAddress,
        subject: mailView?.subject ?? mailTemplate.subject ?? '',
        message: mailView?.text,
        messageHtml: mailView?.html,
        template: mailTemplate.remoteTemplate,
        templateData: data
      })
    }
  }
}
