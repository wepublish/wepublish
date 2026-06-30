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

export class MailProviderError extends Error {}

export interface MailProvider {
  readonly id: string;

  readonly incomingRequestHandler: NextHandleFunction;

  webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>;

  sendMail(props: SendMailProps): Promise<void>;

  getName(): Promise<string>;

  initDatabaseConfiguration(
    id: string,
    type: MailProviderType,
    prisma: PrismaClient
  ): Promise<void>;
}
