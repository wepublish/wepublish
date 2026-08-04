import { BaseMailProvider, MailProviderProps } from './base-mail-provider';
import { MailProviderType } from '@prisma/client';
import {
  CreateMailProviderTemplateProps,
  MailProviderTemplate,
  MailProviderTemplateContent,
  UpdateMailProviderTemplateProps,
  WithExternalId,
} from './mail-provider.interface';

interface FakeTemplate {
  name: string;
  uniqueIdentifier: string;
  html: string;
  subject?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Module-level store so the fake provider keeps content across re-instantiation
// within a process. This makes the create/edit/preview flow testable in local dev.
const fakeTemplateStore = new Map<string, FakeTemplate>();

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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

  async getTemplates(): Promise<MailProviderTemplate[]> {
    return [...fakeTemplateStore.values()].map(
      ({ html, subject, ...rest }) => rest
    );
  }

  async getTemplateUrl() {
    return 'http://example.com/';
  }

  async getTemplateContent(
    template: WithExternalId
  ): Promise<MailProviderTemplateContent> {
    const stored = fakeTemplateStore.get(template.externalMailTemplateId);
    return { html: stored?.html ?? '', subject: stored?.subject };
  }

  async createTemplate(
    props: CreateMailProviderTemplateProps
  ): Promise<MailProviderTemplate> {
    const uniqueIdentifier = slugify(props.name) || `template-${Date.now()}`;
    const now = new Date();
    const template: FakeTemplate = {
      name: props.name,
      uniqueIdentifier,
      html: props.html,
      subject: props.subject,
      createdAt: now,
      updatedAt: now,
    };
    fakeTemplateStore.set(uniqueIdentifier, template);

    const { html, subject, ...rest } = template;
    return rest;
  }

  async updateTemplate(
    template: WithExternalId,
    props: UpdateMailProviderTemplateProps
  ): Promise<void> {
    const existing = fakeTemplateStore.get(template.externalMailTemplateId);
    fakeTemplateStore.set(template.externalMailTemplateId, {
      name: props.name ?? existing?.name ?? template.externalMailTemplateId,
      uniqueIdentifier: template.externalMailTemplateId,
      html: props.html,
      subject: props.subject,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    });
  }

  async deleteTemplate(template: WithExternalId): Promise<void> {
    fakeTemplateStore.delete(template.externalMailTemplateId);
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
