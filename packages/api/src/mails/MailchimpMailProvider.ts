import {Mandrill} from 'mandrill-api'
import crypto from 'crypto'

import {
  BaseMailProvider,
  MailLogStatus,
  MailProviderProps,
  SendMailProps,
  WebhookForSendMailProps
} from './mailProvider'
import {MailLogState} from '../db/mailLog'

export interface MailchimpMailProviderProps extends MailProviderProps {
  readonly apiKey: string
  readonly baseURL: string
  readonly webhookEndpointSecret: string
  readonly fromAddress: string
}

interface VerifyWebhookSignatureProps {
  signature: string
  url: string
  params: Record<string, any>
}

function mapMandrillEventToMailLogState(event: string): MailLogState | null {
  switch (event) {
    case 'send':
      return MailLogState.Delivered
    case 'deferral':
      return MailLogState.Deferred
    case 'hard_bounce':
    case 'soft_bounce':
      return MailLogState.Bounced
    case 'reject':
      return MailLogState.Rejected
    default:
      return null
  }
}

export class MailchimpMailProvider extends BaseMailProvider {
  readonly mandrill: Mandrill
  readonly webhookEndpointSecret: string

  constructor(props: MailchimpMailProviderProps) {
    super(props)
    this.mandrill = new Mandrill(props.apiKey)
    this.webhookEndpointSecret = props.webhookEndpointSecret
  }

  verifyWebhookSignature({signature, url, params}: VerifyWebhookSignatureProps): boolean {
    const keys = Object.keys(params).sort()
    const longString = keys.reduce((sig, key) => {
      return sig + key + params[key]
    }, url || '')
    const generatedSignature = crypto
      .createHmac('sha1', this.webhookEndpointSecret)
      .update(longString)
      .digest('base64')
    return signature === generatedSignature
  }

  webhookForSendMail({req}: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    if (req.method !== 'POST') return Promise.resolve([])
    if (typeof req.headers['x-mandrill-signature'] !== 'string')
      throw new Error('Webhook Header is missing signature ')
    if (
      !this.verifyWebhookSignature({
        signature: req.headers['x-mandrill-signature'],
        url: `https://${req.headers.host}${req.originalUrl}`,
        params: req.body
      })
    )
      throw new Error('Webhook signature failed')

    const mandrillEvents = JSON.parse(req.body.mandrill_events)
    const mailLogStatuses: MailLogStatus[] = []
    for (const mandrillEvent of mandrillEvents) {
      const state = mapMandrillEventToMailLogState(mandrillEvent.event)
      const mailLogID = mandrillEvent?.msg?.metadata?.mail_log_id
      if (state !== null && mailLogID !== undefined) {
        mailLogStatuses.push({
          state,
          mailLogID,
          mailData: JSON.stringify(mandrillEvent)
        })
      }
    }
    return Promise.resolve(mailLogStatuses)
  }

  async sendMail(props: SendMailProps): Promise<void> {
    await this.mandrill.messages.send({
      message: {
        html: `<p>${props.message}</p>`,
        text: props.message,
        subject: props.subject,
        from_email: this.fromAddress,
        to: [
          {
            email: props.recipient,
            type: 'to'
          }
        ],
        metadata: {
          mail_log_id: props.mailLogID
        }
      }
    })
  }
}
