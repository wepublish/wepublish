import {PrismaClient, Subscription, SubscriptionEvent, UserEvent} from '@prisma/client'
import Email from 'email-templates'
import {
  BaseMailProvider,
  MailProviderError,
  MailProviderTemplate
} from './mailProvider'

import {MailController, MailControllerConfig} from '@wepublish/membership/mail'
import {PrismaService} from '@wepublish/api'
import {OldContextService} from '../oldContext.service'
import {SubscriptionEventDictionary} from '@wepublish/membership/subscription-event-dictionary'

export interface SendRemoteEMailProps {
  readonly remoteTemplate: string
  readonly recipient: string
  readonly mailLogID: string
  readonly data: Record<string, any>
}

export interface MailContextOptions {
  readonly defaultFromAddress: string
  readonly defaultReplyToAddress?: string
}

export interface MailContext {
  mailProvider: BaseMailProvider
  prisma: PrismaClient

  defaultFromAddress: string
  defaultReplyToAddress?: string

  sendMail(opts: MailControllerConfig): Promise<void>
}

export interface MailContextProps extends MailContextOptions {
  readonly mailProvider: BaseMailProvider
  readonly prisma: PrismaClient
}

export class MailContext implements MailContext {
  mailProvider: BaseMailProvider

  defaultFromAddress: string
  defaultReplyToAddress?: string

  constructor(props: MailContextProps) {
    this.mailProvider = props.mailProvider
    this.prisma = props.prisma

    this.defaultFromAddress = props.defaultFromAddress
    this.defaultReplyToAddress = props.defaultReplyToAddress
  }

  async sendMail(opts: MailControllerConfig) {
    if (opts.externalMailTemplateId) {
      await new MailController(
        this.prisma as PrismaService,
        {context: global.oldContext} as OldContextService,
        opts
      ).sendMail()
    }
  }

  async sendRemoteTemplateDirect({
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

  async getTemplates(): Promise<MailProviderTemplate[] | MailProviderError> {
    return this.mailProvider.getTemplates()
  }

  async getUsedTemplateIdentifiers(): Promise<string[]> {
    const intervals = await this.prisma.subscriptionInterval.findMany({
      include: {
        mailTemplate: true
      }
    })
    return intervals.map(i => i.mailTemplate?.externalMailTemplateId || '')
  }

  async getSubsciptionTemplateIdentifier(
    subsciption: Subscription,
    subscriptionEvent: SubscriptionEvent
  ): Promise<string | undefined> {
    return SubscriptionEventDictionary.getSubsciptionTemplateIdentifier(
      this.prisma,
      subsciption,
      subscriptionEvent
    )
  }
}
