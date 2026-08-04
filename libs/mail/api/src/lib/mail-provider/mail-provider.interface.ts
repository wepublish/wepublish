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

export interface MailProviderTemplateContent {
  html: string;
  subject?: string;
}

export interface CreateMailProviderTemplateProps {
  name: string;
  description?: string;
  html: string;
  subject?: string;
}

export interface UpdateMailProviderTemplateProps {
  name?: string;
  description?: string;
  html: string;
  subject?: string;
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

  getTemplateUrl(template: WithExternalId): Promise<string>;

  getTemplateContent(
    template: WithExternalId
  ): Promise<MailProviderTemplateContent>;

  createTemplate(
    props: CreateMailProviderTemplateProps
  ): Promise<MailProviderTemplate>;

  updateTemplate(
    template: WithExternalId,
    props: UpdateMailProviderTemplateProps
  ): Promise<void>;

  deleteTemplate(template: WithExternalId): Promise<void>;

  getName(): Promise<string>;

  initDatabaseConfiguration(
    id: string,
    type: MailProviderType,
    prisma: PrismaClient
  ): Promise<void>;
}
