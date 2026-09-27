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

export interface SendMailResult {
  /**
   * Id the provider assigned to the accepted message, when it reports one.
   * Persisted on the mail log so the delivery state can be polled later.
   */
  providerMessageID?: string;
}

/** Current delivery state of one previously sent message, as the provider sees it. */
export interface MailProviderMessageState {
  providerMessageID: string;
  state: MailLogState;
  /** Raw provider payload, stored for diagnosis. */
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

/**
 * A send that failed for this one recipient only — their address bounced, they
 * complained, they unsubscribed, the provider will not deliver to them. The
 * provider itself is healthy and the next recipient is unaffected, so a batch
 * job may record the miss and carry on. Everything else stays a plain
 * {@link MailProviderError} and has to bring the batch down.
 */
export class MailProviderRecipientError extends MailProviderError {}

export interface MailProvider {
  readonly id: string;

  readonly incomingRequestHandler: NextHandleFunction;

  webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>;

  sendMail(props: SendMailProps): Promise<SendMailResult>;

  /**
   * Poll the current delivery state of messages already sent. Complements the
   * webhook: it is the only way to learn the outcome when the provider cannot
   * reach this installation (local development, webhook not configured, missed
   * events). Providers that expose no such lookup return an empty list.
   */
  getMessageStates(
    providerMessageIDs: string[]
  ): Promise<MailProviderMessageState[]>;

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
