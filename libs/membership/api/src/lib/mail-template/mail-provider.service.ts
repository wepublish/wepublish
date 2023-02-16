import {Injectable} from '@nestjs/common'
import {
  MailchimpMailProvider,
  MailgunMailProvider,
  MailProvider,
  PrismaService,
  SettingName
} from '@wepublish/api'

@Injectable()
export class MailProviderService {
  constructor(private prismaService: PrismaService) {}

  async getProvider(): Promise<MailProvider> {
    const providerNameSetting = await this.prismaService.setting.findUnique({
      where: {name: SettingName.MAIL_PROVIDER_NAME}
    })
    const providerName = (providerNameSetting?.value as string) ?? process.env.MAIL_PROVIDER_NAME
    if (providerName == 'mailchimp') {
      return new MailchimpMailProvider({
        baseURL: process.env.MAILCHIMP_WEBHOOK_SECRET || '',
        apiKey: process.env.MAILCHIMP_API_KEY || '',
        webhookEndpointSecret: process.env.MAILCHIMP_WEBHOOK_SECRET || '',
        fromAddress: 'dev@wepublish.ch',
        id: 'mailchimp',
        name: 'Mailchimp'
      })
    } else if (providerName == 'mailgun') {
      return new MailgunMailProvider({
        id: 'mailgun',
        name: 'Mailgun',
        apiKey: process.env.MAILGUN_API_KEY || '',
        baseDomain: process.env.MAILGUN_BASE_DOMAIN || '',
        mailDomain: process.env.MAILGUN_MAIL_DOMAIN || '',
        webhookEndpointSecret: process.env.MAILGUN_WEBHOOK_SECRET || '',
        fromAddress: 'dev@wepublish.ch'
      })
    } else {
      throw new Error(`Invalid mail provider name: ${providerName}`)
    }
  }

  async getUsedTemplateIdentifiers(): Promise<string[]> {
    const intervals = await this.prismaService.subscriptionInterval.findMany({
      include: {
        mailTemplate: true
      }
    })
    return intervals.map(i => i.mailTemplate?.externalMailTemplateId || '')
  }
}
