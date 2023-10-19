import {MailLogState} from '@prisma/client'
import {NextHandleFunction} from 'connect'
import express from 'express'

export const MAIL_WEBHOOK_PATH_PREFIX = 'mail-webhooks'

export interface WebhookForSendMailProps {
  req: express.Request
}

export interface SendMailProps {
  mailLogID: string
  recipient: string
  replyToAddress: string
  subject: string
  message?: string
  messageHtml?: string
  template?: string
  templateData?: Record<string, any>
}

export interface MailLogStatus {
  mailLogID: string
  state: MailLogState
  mailData?: string
}

export interface MailProviderTemplate {
  name: string
  uniqueIdentifier: string
  createdAt: Date
  updatedAt: Date
}

export type WithExternalId = {
  externalMailTemplateId: string
}

export enum MailTemplateStatus {
  Ok = 'ok',
  RemoteMissing = 'remoteMissing',
  Unused = 'unused',
  Error = 'error'
}

export type WithUrlAndStatus<T> = T & {
  url: string
  status: MailTemplateStatus
}

export class MailProviderError extends Error {
  constructor(public message: string) {
    super(message)
  }
}

export interface MailProvider {
  readonly id: string
  readonly name: string

  readonly fromAddress: string

  readonly incomingRequestHandler: NextHandleFunction

  webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>

  sendMail(props: SendMailProps): Promise<void>

  getTemplates(): Promise<MailProviderTemplate[]>

  getTemplateUrl(template: WithExternalId): string
}
