import {
  MailProviderProps,
  BaseMailProvider,
  SendMailProps,
} from '@wepublish/mail/api';
import fetch from 'cross-fetch';
import { PrismaClient, SettingMailProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

class SlackMailConfig {
  private readonly ttl = 60;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async load(): Promise<SettingMailProvider | null> {
    return this.prisma.settingMailProvider.findUnique({
      where: {
        id: this.id,
      },
    });
  }

  async getFromCache(): Promise<SettingMailProvider | null> {
    return this.kv.getOrLoad<SettingMailProvider | null>(
      `slackmail:settings:${this.id}`,
      () => this.load(),
      this.ttl
    );
  }

  async getConfig(): Promise<SettingMailProvider | null> {
    return await this.getFromCache();
  }
}

export class SlackMailProvider extends BaseMailProvider {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    props: MailProviderProps
  ) {
    super(props);
  }

  async webhookForSendMail() {
    return [];
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const config = await new SlackMailConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
    const message = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*From*: ${props.replyToAddress}\n*To*: ${props.recipient}\n*Template*: ${
              props.template
            }\n\`\`\`${JSON.stringify(props.templateData)}\`\`\``,
          },
        },
      ],
    };

    await fetch(config.slack_webhookURL, {
      method: 'POST',
      headers: {
        'Conetent-type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  async getTemplates() {
    return [...Array(10).keys()].map(key => ({
      name: `Slack Template ${key + 1}`,
      uniqueIdentifier: `slack-template-${key + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async getTemplateUrl() {
    return 'http://example.com/';
  }

  async getName(): Promise<string> {
    return (
      (await new SlackMailConfig(this.prisma, this.kv, this.id).getConfig())
        ?.name ?? 'unknown'
    );
  }
}
