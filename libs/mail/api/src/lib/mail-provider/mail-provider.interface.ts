import { MailLogState, MailProviderType, PrismaClient } from '@prisma/client';
import { NextHandleFunction } from 'connect';
import express from 'express';

export interface WebhookForSendMailProps {
  req: express.Request;
}

export interface SendMailProps {
  mailLogID: string;
  recipient: string;
  replyToAddress: string;
  subject: string;
  message?: string;
  messageHtml?: string;
  template?: string;
  templateData?: Record<string, any>;
}

export interface MailLogStatus {
  mailLogID: string;
  state: MailLogState;
  mailData?: string;
}

export interface MailProviderTemplate {
  name: string;
  uniqueIdentifier: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MailProviderTemplateContent extends MailProviderTemplate {
  /** the HTML body of the template */
  html: string;
  /** the subject line of the template (only some providers store this) */
  subject?: string | null;
}

export interface MailProviderTemplateCreateInput {
  name: string;
  html: string;
  subject?: string | null;
}

export interface MailProviderTemplateUpdateInput {
  name?: string;
  html?: string;
  subject?: string | null;
}

/**
 * Capabilities the mail provider supports. Lets the editor disable controls
 * that are not meaningful for the active provider (e.g. subject for Mailgun).
 */
export interface MailProviderCapabilities {
  canCreateTemplates: boolean;
  canUpdateTemplates: boolean;
  canDeleteTemplates: boolean;
  /** whether the provider stores a subject on the template itself */
  supportsTemplateSubject: boolean;
  /** whether the template name is immutable once created (Mailgun, Mandrill) */
  templateNameIsImmutable: boolean;
}

export interface PlaceholderSyntax {
  open: string;
  close: string;
}

export type WithExternalId = {
  externalMailTemplateId: string;
};

export enum MailTemplateStatus {
  Ok = 'ok',
  RemoteMissing = 'remoteMissing',
  Unused = 'unused',
  Error = 'error',
}

export type WithUrlAndStatus<T> = T & {
  url: string;
  status: MailTemplateStatus;
};

export class MailProviderError extends Error {}

export interface MailProvider {
  readonly id: string;

  readonly incomingRequestHandler: NextHandleFunction;

  webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>;

  sendMail(props: SendMailProps): Promise<void>;

  getTemplates(): Promise<MailProviderTemplate[]>;

  getTemplate(uniqueIdentifier: string): Promise<MailProviderTemplateContent>;

  createTemplate(
    input: MailProviderTemplateCreateInput
  ): Promise<MailProviderTemplate>;

  updateTemplate(
    uniqueIdentifier: string,
    input: MailProviderTemplateUpdateInput
  ): Promise<MailProviderTemplate>;

  deleteTemplate(uniqueIdentifier: string): Promise<void>;

  getTemplateUrl(template: WithExternalId): Promise<string>;

  getName(): Promise<string>;

  getCapabilities(): MailProviderCapabilities;

  getPlaceholderSyntax(): PlaceholderSyntax;

  initDatabaseConfiguration(
    id: string,
    type: MailProviderType,
    prisma: PrismaClient
  ): Promise<void>;
}
