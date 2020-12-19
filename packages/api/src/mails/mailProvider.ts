import {WepublishServerOpts} from '../server'
import {Router} from 'express'
import bodyParser from 'body-parser'
import {contextFromRequest} from '../context'

export const MAIL_WEBHOOK_PATH_PREFIX = 'mail-webhooks'

export interface WebhookForSendMailProps {
  mail: any
  body: any
  headers: any
}

export interface GetMailIDFromWebhookProps {
  body: any
  headers: any
}

export interface SendMailProps {
  mailLogID: string
  recipient: string[]
  replyToAddress: string
  subject: string
  message?: string
  template?: string
  templateData?: Record<string, any>
}

export interface MailStatus {
  done: boolean
  successful: boolean
  mailData?: string
}

export interface MailProvider {
  id: string
  name: string

  getMailIDFromWebhook(props: GetMailIDFromWebhookProps): string

  webhookForSendMail(props: WebhookForSendMailProps): Promise<MailStatus>

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

  abstract getMailIDFromWebhook(props: GetMailIDFromWebhookProps): string

  abstract webhookForSendMail(props: WebhookForSendMailProps): Promise<MailStatus>

  abstract sendMail(props: SendMailProps): Promise<void>
}

export function setupMailProvider(opts: WepublishServerOpts): Router {
  const {mailProvider} = opts
  const mailProviderWebhookRouter = Router()

  mailProviderWebhookRouter
    .route(`/${mailProvider.id}`)
    .all(bodyParser.raw({type: 'application/json'}), async (req, res, next) => {
      res.status(200).send() // respond immediately with 200 since webhook was received.
      try {
        const {body, headers} = req
        const id = mailProvider.getMailIDFromWebhook({body, headers})
        const context = await contextFromRequest(req, opts)

        const mailLog = await context.loaders.mailLogsByID.load(id)
        const mailLogStatus = await mailProvider.webhookForSendMail({mail: mailLog, body, headers})

        if (mailLog && mailLogStatus) {
          await context.dbAdapter.mailLog.updateMailLog({
            id: mailLog.id,
            input: {
              recipients: mailLog.recipients,
              subject: mailLog.subject,
              successful: mailLogStatus.successful,
              done: mailLogStatus.done,
              mailProviderID: mailLog.mailProviderID,
              mailData: mailLogStatus.mailData
            }
          })
        }
      } catch (exception) {
        console.warn('Exception during mail update from webhook', exception)
      }
    })

  return mailProviderWebhookRouter
}
