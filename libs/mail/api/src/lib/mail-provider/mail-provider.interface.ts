import {
  EmailQualityEventType,
  MailLogState,
  MailProviderType,
} from '@prisma/client';
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

/** Evidence about the recipient's address a provider reports for a mail. */
export interface MailQualitySignal {
  type: EmailQualityEventType;
  /** Recipient address as the provider reports it. */
  email?: string;
  /** Reject reason or bounce diagnosis. */
  detail?: string | null;
  occurredAt?: Date;
  /**
   * Provider's id of the event, prefixed with the provider type, so the same
   * event delivered twice is stored once even without a mail log.
   */
  providerEventId?: string;
}

/**
 * What a provider event means for us. Either about one of our mails
 * (`mailLogID`) or only about an address (`email`), like a newsletter
 * campaign bounce.
 */
export interface MailLogStatus {
  mailLogID?: string;
  email?: string;
  /** Null for events that say something about the address but do not change the delivery state, like clicks or complaints. */
  state: MailLogState | null;
  mailData?: string;
  qualitySignals?: MailQualitySignal[];
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
  qualitySignals?: MailQualitySignal[];
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
 * A webhook call that did not come from the provider. The controller answers
 * it with 401; every other error is ours and must not make the provider
 * retry or, worse, drop the event.
 */
export class MailWebhookSignatureError extends MailProviderError {}

/**
 * A send that failed for this one recipient only — their address bounced, they
 * complained, they unsubscribed, the provider will not deliver to them. The
 * provider itself is healthy and the next recipient is unaffected, so a batch
 * job may record the miss and carry on. Everything else stays a plain
 * {@link MailProviderError} and has to bring the batch down.
 */
export class MailProviderRecipientError extends MailProviderError {
  constructor(
    message: string,
    /** The provider's reason, e.g. `hard-bounce`, `spam` or `invalid`. */
    readonly reason?: string
  ) {
    super(message);
  }
}

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

  /**
   * The addresses the provider refuses to deliver to and why: its rejection
   * denylist, bounce and complaint lists. These are kept per account or
   * domain, so they cover mails sent outside We.Publish too. Each signal
   * carries the address and a provider event id for deduplication. Providers
   * without such lists return an empty list.
   */
  listSuppressions(): Promise<MailQualitySignal[]>;

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
