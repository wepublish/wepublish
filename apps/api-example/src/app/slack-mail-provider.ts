import {
  MailProviderProps,
  BaseMailProvider,
  SendMailProps,
} from '@wepublish/mail/api';
import fetch from 'cross-fetch';

export class SlackMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  async webhookForSendMail() {
    return [];
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const config = await this.getConfig();
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
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
