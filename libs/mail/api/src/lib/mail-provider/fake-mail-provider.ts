import { BaseMailProvider, MailProviderProps } from './base-mail-provider';
import { MailProviderType } from '@prisma/client';

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
    return 'MockProvider';
  }
  override async initDatabaseConfiguration(
    type: MailProviderType
  ): Promise<void> {
    return;
  }
}
