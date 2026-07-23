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
            text: `*From*: ${props.replyToAddress}\n*To*: ${props.recipient}\n*Subject*: ${
              props.subject
            }\n\`\`\`${props.messageHtml ?? props.message ?? ''}\`\`\``,
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
      signal: AbortSignal.timeout(5_000),
    });
  }

  async getTemplateContent() {
    return { html: '', subject: '' };
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
