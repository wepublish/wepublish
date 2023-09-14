import {MailLogState} from '@prisma/client'
import crypto from 'crypto'
import FormData from 'form-data'

import {
  BaseMailProvider,
  MailLogStatus,
  MailProviderProps,
  SendMailProps,
  WebhookForSendMailProps
} from './mailProvider'

export interface MailgunMailProviderProps extends MailProviderProps {
  apiKey: string
  baseDomain: string
  mailDomain: string
  webhookEndpointSecret: string
  fromAddress: string
}

interface VerifyWebhookSignatureProps {
  timestamp: string
  token: string
  signature: string
}

function mapMailgunEventToMailLogState(event: string): MailLogState | null {
  switch (event) {
    case 'accepted':
      return MailLogState.accepted
    case 'delivered':
      return MailLogState.delivered
    case 'failed':
      return MailLogState.bounced
    case 'rejected':
      return MailLogState.rejected
    default:
      return null
  }
}

export class MailgunMailProvider extends BaseMailProvider {
  readonly auth: string
  readonly baseDomain: string
  readonly mailDomain: string
  readonly webhookEndpointSecret: string

  constructor(props: MailgunMailProviderProps) {
    super(props)
    this.auth = Buffer.from(`api:${props.apiKey}`).toString('base64')
    this.baseDomain = props.baseDomain
    this.mailDomain = props.mailDomain
    this.webhookEndpointSecret = props.webhookEndpointSecret
  }

  verifyWebhookSignature(props: VerifyWebhookSignatureProps): boolean {
    const encodedToken = crypto
      .createHmac('sha256', this.webhookEndpointSecret)
      .update(props.timestamp.concat(props.token))
      .digest('hex')

    return encodedToken === props.signature
  }

  async webhookForSendMail({req}: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    const {body} = req
    if (!body.signature) throw new Error('No signature in webhook body')
    const {signature, token, timestamp} = body.signature as VerifyWebhookSignatureProps
    if (
      !timestamp ||
      !token ||
      !signature ||
      !this.verifyWebhookSignature({timestamp, token, signature})
    )
      throw new Error('Webhook signature failed')

    const mailLogStatuses: MailLogStatus[] = []
    if (!body['event-data']) throw new Error('No event-data in webhook body')
    const state = mapMailgunEventToMailLogState(body['event-data'].event)
    if (!body['event-data']['user-variables']) throw new Error('No user-variables in webhook body')
    const mailLogID = body['event-data']['user-variables'].mail_log_id
    if (state !== null && mailLogID !== undefined) {
      mailLogStatuses.push({
        state,
        mailLogID,
        mailData: JSON.stringify(body['event-data'])
      })
    }
    return Promise.resolve(mailLogStatuses)
  }

  async sendMail(props: SendMailProps): Promise<void> {
    return new Promise((resolve, reject) => {
      const form = new FormData()
      form.append('from', this.fromAddress)
      form.append('to', props.recipient)
      form.append('subject', props.subject)
      form.append('text', props.message ?? '')
      if (props.messageHtml) {
        form.append('html', props.messageHtml)
      }
      if (props.template) {
        form.append('template', props.template)
        for (const [key, value] of Object.entries(props.templateData || {})) {
          const serializedValue =
            typeof value === 'string' || typeof value === 'number'
              ? `${value}`
              : JSON.stringify(value)
          form.append(`v:${key}`, serializedValue)
        }
      }
      form.append('v:mail_log_id', props.mailLogID)
      form.submit(
        {
          protocol: 'https:',
          host: this.baseDomain,
          path: `/v3/${this.mailDomain}/messages`,
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${this.auth}`
          }
        },
        (err, res) => {
          return err || res.statusCode !== 200 ? reject(err || res) : resolve()
        }
      )
    })
  }
}
