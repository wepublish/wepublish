import {MailLogState} from '@prisma/client'
import bodyParser from 'body-parser'
import {NextHandleFunction} from 'connect'
import express, {Router} from 'express'
import {contextFromRequest} from '../context'
import {logger, WepublishServerOpts} from '../server'

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
  id: string
  name: string

  incomingRequestHandler: NextHandleFunction

  webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>

  sendMail(props: SendMailProps): Promise<void | MailProviderError>

  getTemplates(): Promise<MailProviderTemplate[] | MailProviderError>

  getTemplateUrl(template: WithExternalId): string
}

export interface MailProviderProps {
  id: string
  name: string
  fromAddress: string
  incomingRequestHandler?: NextHandleFunction
}

export abstract class BaseMailProvider implements MailProvider {
  readonly id: string
  readonly name: string
  readonly fromAddress: string

  readonly incomingRequestHandler: NextHandleFunction

  protected constructor(props: MailProviderProps) {
    this.id = props.id
    this.name = props.name
    this.fromAddress = props.fromAddress
    this.incomingRequestHandler = props.incomingRequestHandler ?? bodyParser.json()
  }

  abstract webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>

  abstract sendMail(props: SendMailProps): Promise<void | MailProviderError>

  abstract getTemplates(): Promise<MailProviderTemplate[] | MailProviderError>

  abstract getTemplateUrl(template: WithExternalId): string
}

export function setupMailProvider(opts: WepublishServerOpts): Router {
  const {mailProvider} = opts
  const mailProviderWebhookRouter = Router()
  if (mailProvider) {
    mailProviderWebhookRouter
      .route(`/${mailProvider.id}`)
      .all(mailProvider.incomingRequestHandler, async (req, res, next) => {
        res.status(200).send() // respond immediately with 200 since webhook was received.
        logger('mailProvider').info(
          'Received webhook from %s for mailProvider %s',
          req.get('origin'),
          mailProvider.id
        )

        try {
          const mailLogStatuses = await mailProvider.webhookForSendMail({req})
          const context = await contextFromRequest(req, opts)

          for (const mailLogStatus of mailLogStatuses) {
            const mailLog = await context.loaders.mailLogsByID.load(mailLogStatus.mailLogID)
            if (!mailLog) continue // TODO: handle missing mailLog

            await context.prisma.mailLog.update({
              where: {id: mailLog.id},
              data: {
                subject: mailLog.subject,
                mailProviderID: mailLog.mailProviderID,
                state: mailLogStatus.state,
                mailData: mailLogStatus.mailData
              }
            })
          }
        } catch (error) {
          logger('mailProvider').error(
            error as Error,
            'Error during webhook update in mailProvider %s',
            mailProvider.id
          )
        }
      })
  }

  return mailProviderWebhookRouter
}
