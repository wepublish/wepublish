import fetch from 'cross-fetch'
import crypto from 'crypto'
import FormData from 'form-data'

import {
  BaseMailProvider,
  GetMailIDFromWebhookProps,
  MailProviderProps,
  MailStatus,
  SendMailProps,
  WebhookForSendMailProps
} from './mailProvider'

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

  getMailIDFromWebhook(props: GetMailIDFromWebhookProps): string {
    const body = JSON.parse(props.body.toString())
    if (!body.signature) throw new Error('No signature in webhook body')
    const {signature, token, timestamp} = body.signature as VerifyWebhookSignatureProps
    if (
      !timestamp ||
      !token ||
      !signature ||
      !this.verifyWebhookSignature({timestamp, token, signature})
    )
      throw new Error('Webhook signature failed')

    if (!body['event-data']) throw new Error('No event-data in webhook body')
    if (!body['event-data']['user-variables']) throw new Error('No user-variables in webhook body')
    return body['event-data']['user-variables'].mail_log_id
  }

  async webhookForSendMail(props: WebhookForSendMailProps): Promise<MailStatus> {
    const body = JSON.parse(props.body.toString())
    if (!body.signature) throw new Error('No signature in webhook body')
    const {signature, token, timestamp} = body.signature as VerifyWebhookSignatureProps
    if (
      !timestamp ||
      !token ||
      !signature ||
      !this.verifyWebhookSignature({timestamp, token, signature})
    )
      throw new Error('Webhook signature failed')

    if (!body['event-data']) throw new Error('No event-data in webhook body')

    const done = body['event-data'].event === 'delivered'
    const successful = body['event-data'].event === 'delivered'
    return {
      done,
      successful,
      mailData: JSON.stringify(body['event-data'])
    }
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const form = new FormData()
    form.append('from', this.fromAddress)
    props.recipient.forEach(recipient => {
      form.append('to', recipient)
    })
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
