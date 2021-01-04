import {
  BaseMailProvider,
  MailLogStatus,
  MailProviderProps,
  SendMailProps,
  WebhookForSendMailProps
} from '@wepublish/api'

import fetch from 'cross-fetch'

export interface SlackMailProviderProps extends MailProviderProps {
  webhookURL: string
}

export class SlackMailProvider extends BaseMailProvider {
  readonly webhookURL: string

  constructor(props: SlackMailProviderProps) {
    super(props)
    this.webhookURL = props.webhookURL
  }

  async webhookForSendMail({req}: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    return Promise.resolve([])
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const message = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*From*: ${props.replyToAddress}\n*To*: ${props.recipient}\n*Subject*: ${props.subject}\n\`\`\`${props.message}\`\`\``
          }
        }
      ]
    }
    await fetch(this.webhookURL, {
      method: 'POST',
      headers: {
        'Conetent-type': 'application/json'
      },
      body: JSON.stringify(message)
    })
  }
}
