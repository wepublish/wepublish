import { BaseMailProvider, MailProviderProps } from './base-mail-provider';
import { MailProviderType } from '@prisma/client';
import {
  MailProviderCapabilities,
  MailProviderTemplate,
  MailProviderTemplateContent,
  MailProviderTemplateCreateInput,
  MailProviderTemplateUpdateInput,
  PlaceholderSyntax,
} from './mail-provider.interface';

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

  async getTemplate(
    uniqueIdentifier: string
  ): Promise<MailProviderTemplateContent> {
    return {
      name: uniqueIdentifier,
      uniqueIdentifier,
      createdAt: new Date(),
      updatedAt: new Date(),
      html: '',
      subject: null,
    };
  }

  async createTemplate(
    input: MailProviderTemplateCreateInput
  ): Promise<MailProviderTemplate> {
    return {
      name: input.name,
      uniqueIdentifier: input.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateTemplate(
    uniqueIdentifier: string,
    input: MailProviderTemplateUpdateInput
  ): Promise<MailProviderTemplate> {
    return {
      name: input.name ?? uniqueIdentifier,
      uniqueIdentifier,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteTemplate(): Promise<void> {
    return;
  }

  async getTemplateUrl() {
    return 'http://example.com/';
  }
  async getName(): Promise<string> {
    return 'MockProvider';
  }
  getCapabilities(): MailProviderCapabilities {
    return {
      canCreateTemplates: true,
      canUpdateTemplates: true,
      canDeleteTemplates: true,
      supportsTemplateSubject: true,
      templateNameIsImmutable: true,
    };
  }
  getPlaceholderSyntax(): PlaceholderSyntax {
    return { open: '{{', close: '}}' };
  }
  override async initDatabaseConfiguration(
    type: MailProviderType
  ): Promise<void> {
    return;
  }
}
