import {MailTemplate} from '@prisma/client'
import {BaseMailProvider, MailProviderProps} from './base-mail-provider'
import {
  MailLogStatus,
  MailProviderTemplate,
  SendMailProps,
  WebhookForSendMailProps
} from './mail-provider.interface'

export class FakeMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props)
  }

  async webhookForSendMail({req}: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    return Promise.resolve([])
  }

  async sendMail(props: SendMailProps): Promise<void> {
    return
  }

  async getTemplates(): Promise<MailProviderTemplate[]> {
    return []
  }

  getTemplateUrl(template: MailTemplate): string {
    return 'http://example.com/'
  }
}
