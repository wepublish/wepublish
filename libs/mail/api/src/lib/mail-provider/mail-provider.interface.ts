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

  getName(): Promise<string>;

  initDatabaseConfiguration(
    id: string,
    type: MailProviderType,
    prisma: PrismaClient
  ): Promise<void>;
}
