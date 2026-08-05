import { MailLogState, MailProviderType } from '@prisma/client';
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
}

export interface MailLogStatus {
  mailLogID: string;
  state: MailLogState;
  mailData?: string;
}

export enum MailTemplateStatus {
  Ok = 'ok',
  Unused = 'unused',
  Error = 'error',
}

export interface MailProviderTemplateContent {
  html: string;
  subject?: string;
}

/** A template as it exists on the remote provider, for discovery on import. */
export interface MailProviderTemplate {
  /** Stable remote identifier, stored as `MailTemplate.externalMailTemplateId`. */
  externalId: string;
  name: string;
  html: string;
  subject?: string;
}

export class MailProviderError extends Error {}

export interface MailProvider {
  readonly id: string;

  readonly incomingRequestHandler: NextHandleFunction;

  webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>;

  sendMail(props: SendMailProps): Promise<void>;

  /** Fetch a template's content from the remote provider (for import/migration). */
  getTemplateContent(
    externalMailTemplateId: string
  ): Promise<MailProviderTemplateContent>;

  /**
   * List every template available on the remote provider. Providers without a
   * remote template store return an empty list.
   */
  listTemplates(): Promise<MailProviderTemplate[]>;

  getName(): Promise<string>;

  initDatabaseConfiguration(type: MailProviderType): Promise<void>;
}
