import fetch from 'cross-fetch'
import crypto from 'crypto'
import FormData from 'form-data'

import {
  BaseMailProvider,
  MailLogStatus,
  MailProviderProps,
  SendMailProps,
  WebhookForSendMailProps
} from './mailProvider'
import {MailLogState} from '../db/mailLog'

export interface MailgunMailProviderProps extends MailProviderProps {
  apiKey: string
  baseURL: string
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
      return MailLogState.Accepted
    case 'delivered':
      return MailLogState.Delivered
    case 'failed':
      return MailLogState.Bounced
    case 'rejected':
      return MailLogState.Rejected
    default:
      return null
  }
}

export class MailgunMailProvider extends BaseMailProvider {
  readonly auth: string
  readonly domain: string
  readonly webhookEndpointSecret: string

  constructor(props: MailgunMailProviderProps) {
    super(props)
    this.auth = Buffer.from(`api:${props.apiKey}`).toString('base64')
    this.domain = props.baseURL
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
    const form = new FormData()
    form.append('from', this.fromAddress)
    form.append('to', props.recipient)
    form.append('subject', props.subject)
    form.append('text', props.message ?? '')
    form.append('v:mail_log_id', props.mailLogID)
    const res = await fetch(`${this.domain}/messages`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${this.auth}`
      },
      // @ts-ignore
      body: form
    })
    if (res.status !== 200) throw new Error(`Mailgun returned NOK with status code ${res.status}`)
  }
}
