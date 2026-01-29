import { BaseMailProvider, MailProviderProps } from './base-mail-provider';

export class FakeMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  async webhookForSendMail() {
    return [];
  }

  async sendMail() {
    return;
  }

  async getTemplates() {
    return [];
  }

  async getTemplateUrl() {
    return 'http://example.com/';
  }
  async getName(): Promise<string> {
    return 'fake-mail-provider';
  }
}
