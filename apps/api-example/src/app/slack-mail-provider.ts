import {
  MailProviderProps,
  BaseMailProvider,
  SendMailProps,
} from '@wepublish/mail/api';
import fetch from 'cross-fetch';

export interface SlackMailProviderProps extends MailProviderProps {
  webhookURL: string;
}

export class SlackMailProvider extends BaseMailProvider {
  readonly webhookURL: string;

  constructor(props: SlackMailProviderProps) {
    super(props);
    this.webhookURL = props.webhookURL;
  }

  async webhookForSendMail() {
    return [];
  }

  async sendMail(props: SendMailProps): Promise<void> {
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

    await fetch(this.webhookURL, {
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

  getTemplateUrl() {
    return 'http://example.com/';
  }
}
