import {WepublishServerOpts} from '../server'
import express, {Router} from 'express'
import {contextFromRequest} from '../context'
import {MailLogState} from '../db/mailLog'

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
  template?: string
  templateData?: Record<string, any>
}

export interface MailLogStatus {
  mailLogID: string
  state: MailLogState
  mailData?: string
}

export interface MailProvider {
  id: string
  name: string

  webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>

  sendMail(props: SendMailProps): Promise<void>
}

export interface MailProviderProps {
  id: string
  name: string
  fromAddress: string
}

export abstract class BaseMailProvider implements MailProvider {
  readonly id: string
  readonly name: string
  readonly fromAddress: string

  protected constructor(props: MailProviderProps) {
    this.id = props.id
    this.name = props.name
    this.fromAddress = props.fromAddress
  }

  abstract webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>

  abstract sendMail(props: SendMailProps): Promise<void>
}

export function setupMailProvider(opts: WepublishServerOpts): Router {
  const {mailProvider} = opts
  const mailProviderWebhookRouter = Router()
  if (mailProvider) {
    mailProviderWebhookRouter.route(`/${mailProvider.id}`).all(async (req, res, next) => {
      res.status(200).send() // respond immediately with 200 since webhook was received.
      try {
        const mailLogStatuses = await mailProvider.webhookForSendMail({req})
        const context = await contextFromRequest(req, opts)

        for (const mailLogStatus of mailLogStatuses) {
          const mailLog = await context.loaders.mailLogsByID.load(mailLogStatus.mailLogID)
          if (!mailLog) continue // TODO: handle missing mailLog
          await context.dbAdapter.mailLog.updateMailLog({
            id: mailLog.id,
            input: {
              recipient: mailLog.recipient,
              subject: mailLog.subject,
              mailProviderID: mailLog.mailProviderID,
              state: mailLogStatus.state,
              mailData: mailLogStatus.mailData
            }
          })
        }
      } catch (exception) {
        console.warn('Exception during mail update from webhook', exception)
      }
    })
  }

  return mailProviderWebhookRouter
}
