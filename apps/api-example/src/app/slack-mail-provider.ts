import {
  MailProviderProps,
  BaseMailProvider,
  SendMailProps,
  SendMailResult,
} from '@wepublish/mail/api';
import fetch from 'cross-fetch';

export class SlackMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  async webhookForSendMail() {
    return [];
  }

  async sendMail(props: SendMailProps): Promise<SendMailResult> {
    const config = await this.getConfig();

    if (!config?.slack_webhookURL) {
      console.warn(
        `SlackMailProvider <${this.id}>: slack_webhookURL is not configured, skipping mail to ${props.recipient}`
      );

      return;
    }

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
        'Content-type': 'application/json',
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(5_000),
    });

    return {};
  }

  async getTemplateContent() {
    return { html: '', subject: '' };
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
