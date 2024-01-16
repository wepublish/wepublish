import crypto from 'crypto'

import mailchimp, {TemplateResponse} from '@mailchimp/mailchimp_transactional'
import {AxiosError} from 'axios'

import {MailLogState} from '@prisma/client'
import {
  MailLogStatus,
  MailProviderError,
  MailProviderTemplate,
  SendMailProps,
  WebhookForSendMailProps,
  WithExternalId
} from './mail-provider.interface'
import {BaseMailProvider, MailProviderProps} from './base-mail-provider'

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
      return MailLogState.delivered
    case 'deferral':
      return MailLogState.deferred
    case 'hard_bounce':
    case 'soft_bounce':
      return MailLogState.bounced
    case 'reject':
      return MailLogState.rejected
    default:
      return null
  }
}

/*
 * Mandrill template engine does not support nested objects
 */
function flattenObjForMandrill<T>(ob: T): Record<string, string> {
  const nestedObject: Record<string, string> = {}

  for (const i in ob) {
    const nestedObj = ob[i]

    if (Array.isArray(nestedObj)) {
      for (const j in nestedObj) {
        if (nestedObj[j] && typeof nestedObj[j] === 'object') {
          const returnedNestedObject = flattenObjForMandrill(nestedObj[j])

          for (const k in returnedNestedObject) {
            nestedObject[`${i}_${j}_${k}`] = returnedNestedObject[k]
          }
        } else {
          nestedObject[`${i}_${j}`] = nestedObj[j]
        }
      }
    } else if (nestedObj && typeof nestedObj === 'object') {
      const returnedNestedObject = flattenObjForMandrill(nestedObj)

      for (const j in returnedNestedObject) {
        nestedObject[`${i}_${j}`] = returnedNestedObject[j]
      }
    } else {
      // eventho it should be string according to Mandrill typings
      // it accepts booleans, numbers etc.
      nestedObject[i] = nestedObj as any
    }
  }

  return nestedObject
}

export class MailchimpMailProvider extends BaseMailProvider {
  readonly webhookEndpointSecret: string
  readonly mailchimpClient: mailchimp.ApiClient

  constructor(props: MailchimpMailProviderProps) {
    super(props)
    this.webhookEndpointSecret = props.webhookEndpointSecret
    this.mailchimpClient = mailchimp(props.apiKey)
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

  async webhookForSendMail({req}: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    if (req.method !== 'POST') {
      return []
    }

    if (typeof req.headers['x-mandrill-signature'] !== 'string') {
      throw new Error('Webhook Header is missing signature')
    }

    if (
      !this.verifyWebhookSignature({
        signature: req.headers['x-mandrill-signature'],
        url: `https://${req.headers.host}${req.originalUrl}`,
        params: req.body
      })
    ) {
      throw new Error('Webhook signature failed')
    }

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

    return mailLogStatuses
  }

  async sendMail(props: SendMailProps): Promise<void> {
    if (props.template) {
      const templateContent: mailchimp.MergeVar[] = []
      const flattenedObject = flattenObjForMandrill(props.templateData ?? {})

      for (const [key, value] of Object.entries(flattenedObject)) {
        templateContent.push({
          name: key,
          content: value
        })
      }

      const response = await this.mailchimpClient.messages.sendTemplate({
        template_name: props.template,
        template_content: [],
        message: {
          text: props.message,
          subject: props.subject,
          from_email: this.fromAddress,
          to: [
            {
              email: props.recipient,
              type: 'to'
            }
          ],
          merge_vars: [
            {
              rcpt: props.recipient,
              vars: templateContent
            }
          ]
        }
      })

      if (this.responseIsError(response)) {
        throw new MailProviderError(response.response?.data.message)
      }

      return
    }

    const response = await this.mailchimpClient.messages.send({
      message: {
        html: props.messageHtml,
        text: props.message,
        subject: props.subject,
        from_email: this.fromAddress,
        to: [
          {
            email: props.recipient,
            type: 'to'
          }
        ]
      }
    })

    if (this.responseIsError(response)) {
      throw new MailProviderError(response.response?.data.message)
    }
  }

  // beware: Mailchimp templates are still created and stored in Mandrill: https://mandrillapp.com/templates
  async getTemplates(): Promise<MailProviderTemplate[]> {
    const response = await this.mailchimpClient.templates.list()
    if (this.responseIsError(response)) {
      throw new MailProviderError(response.response?.data.message)
    }
    const templates: MailProviderTemplate[] = (response as TemplateResponse[]).map(
      mailTemplateResponse => {
        return {
          name: mailTemplateResponse.name,
          uniqueIdentifier: mailTemplateResponse.slug,
          createdAt: new Date(mailTemplateResponse.created_at),
          updatedAt: new Date(mailTemplateResponse.updated_at)
        }
      }
    )
    return templates
  }

  getTemplateUrl(template: WithExternalId): string {
    return `https://mandrillapp.com/templates/code?id=${template.externalMailTemplateId}`
  }

  private responseIsError<T>(response: T | AxiosError): response is AxiosError {
    return 'isAxiosError' in (response as object)
  }
}
