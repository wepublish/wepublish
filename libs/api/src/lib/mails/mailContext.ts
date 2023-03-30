import {PrismaClient, UserEvent} from '@prisma/client'
import Email from 'email-templates'
import {logger} from '../server'
import {
  BaseMailProvider,
  MailProvider,
  MailProviderError,
  MailProviderTemplate
} from './mailProvider'

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
export interface SendRemoteEMailProps {
  readonly remoteTemplate: string
  readonly recipient: string
  readonly mailLogID: string
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
  async sendRemoteTemplate({
    remoteTemplate,
    recipient,
    data,
    mailLogID
  }: SendRemoteEMailProps): Promise<void> {
    if (!this.mailProvider) {
      throw new Error('MailProvider is not set!')
    }
    await this.mailProvider.sendMail({
      mailLogID,
      recipient,
      replyToAddress: this.defaultReplyToAddress ?? this.defaultFromAddress,
      subject: '',
      template: remoteTemplate,
      templateData: data
    })
  }

  async getUserTemplateName(event: UserEvent): Promise<string> {
    const userFlowMail = await this.prisma.userFlowMail.findUnique({
      where: {
        event
      },
      include: {
        mailTemplate: true
      }
    })
    if (!userFlowMail) {
      throw new Error(`No UserFlowMail defined for event ${event}`)
    }
    return userFlowMail.mailTemplate.externalMailTemplateId
  }

  getProvider(): MailProvider {
    if (!this.mailProvider) {
      throw new Error('MailProvider in MailContext must be defined!')
    }
    return this.mailProvider
  }

  async getTemplates(): Promise<MailProviderTemplate[] | MailProviderError> {
    return this.getProvider().getTemplates()
  }

  async getUsedTemplateIdentifiers(): Promise<string[]> {
    const intervals = await this.prisma.subscriptionInterval.findMany({
      include: {
        mailTemplate: true
      }
    })
    return intervals.map(i => i.mailTemplate?.externalMailTemplateId || '')
  }

  /**
   * @deprecated use sendNewMail instead
   */
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

    if (this.mailProvider) {
      await this.mailProvider.sendMail({
        mailLogID: '1',
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
