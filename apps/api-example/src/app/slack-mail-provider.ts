import {
  MailProviderProps,
  BaseMailProvider,
  SendMailProps,
  MailProviderCapabilities,
  MailProviderError,
  PlaceholderSyntax,
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
      signal: AbortSignal.timeout(5_000),
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

  async getTemplate() {
    throw new MailProviderError(
      'Slack provider does not support template editing.'
    );
    // unreachable; satisfies TS return type
    return undefined as never;
  }

  async createTemplate() {
    throw new MailProviderError(
      'Slack provider does not support creating templates.'
    );
    return undefined as never;
  }

  async updateTemplate() {
    throw new MailProviderError(
      'Slack provider does not support updating templates.'
    );
    return undefined as never;
  }

  async deleteTemplate() {
    throw new MailProviderError(
      'Slack provider does not support deleting templates.'
    );
  }

  async getTemplateUrl() {
    return 'http://example.com/';
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }

  getCapabilities(): MailProviderCapabilities {
    return {
      canCreateTemplates: false,
      canUpdateTemplates: false,
      canDeleteTemplates: false,
      supportsTemplateSubject: false,
      templateNameIsImmutable: true,
    };
  }

  getPlaceholderSyntax(): PlaceholderSyntax {
    return { open: '{{', close: '}}' };
  }
}
