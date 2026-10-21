import { EmailQualityEventType, MailLogState } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import {
  MailLogStatus,
  MailProviderError,
  MailProviderMessageState,
  MailProviderTemplate,
  MailProviderTemplateContent,
  MailQualitySignal,
  MailWebhookSignatureError,
  SendMailProps,
  SendMailResult,
  WebhookForSendMailProps,
} from './mail-provider.interface';
import { BaseMailProvider, MailProviderProps } from './base-mail-provider';

const API = 'https://api.brevo.com/v3';

/** Brevo's list endpoints take at most this many per page. */
const PAGE = 500;

/** Events per message to read; a mail rarely has more than a handful. */
const EVENTS_PER_MESSAGE = 100;

/**
 * The events of Brevo's transactional webhook and of its events endpoint,
 * which spells the same things in the plural. Nothing here about opens:
 * mail clients and scanners load pixels on their own.
 */
const STATES: Record<string, MailLogState> = {
  request: MailLogState.submitted,
  requests: MailLogState.submitted,
  delivered: MailLogState.delivered,
  deferred: MailLogState.deferred,
  // Brevo retries a soft bounce; the address said nothing final yet.
  soft_bounce: MailLogState.deferred,
  softBounces: MailLogState.deferred,
  hard_bounce: MailLogState.bounced,
  hardBounces: MailLogState.bounced,
  invalid_email: MailLogState.bounced,
  invalid: MailLogState.bounced,
  blocked: MailLogState.rejected,
  error: MailLogState.rejected,
};

const QUALITY: Record<string, EmailQualityEventType> = {
  hard_bounce: EmailQualityEventType.hardBounce,
  hardBounces: EmailQualityEventType.hardBounce,
  invalid_email: EmailQualityEventType.invalid,
  invalid: EmailQualityEventType.invalid,
  blocked: EmailQualityEventType.blocked,
  spam: EmailQualityEventType.spamComplaint,
  // Brevo then refuses every further transactional mail to the address.
  unsubscribed: EmailQualityEventType.unsubscribed,
  click: EmailQualityEventType.clicked,
  clicks: EmailQualityEventType.clicked,
};

/**
 * Why Brevo blocks an address, from `GET /smtp/blockedContacts`. Every code
 * means the same thing for us: no further transactional mail gets through.
 */
const BLOCK_REASONS: Record<string, EmailQualityEventType> = {
  hardBounce: EmailQualityEventType.hardBounce,
  contactFlaggedAsSpam: EmailQualityEventType.spamComplaint,
  unsubscribedViaMA: EmailQualityEventType.unsubscribed,
  unsubscribedViaEmail: EmailQualityEventType.unsubscribed,
  unsubscribedViaApi: EmailQualityEventType.unsubscribed,
  adminBlocked: EmailQualityEventType.blocked,
};

type WebhookEvent = {
  event?: string;
  email?: string;
  id?: number | string;
  'message-id'?: string;
  ts?: number;
  ts_event?: number;
  date?: string;
  reason?: string;
  'X-Mailin-custom'?: string;
};

type StatisticsEvent = {
  email?: string;
  date?: string;
  event?: string;
  reason?: string;
};

type BlockedContact = {
  email?: string;
  reason?: { code?: string; message?: string };
  blockedAt?: string;
};

type Template = {
  id?: number | string;
  name?: string;
  subject?: string;
  htmlContent?: string;
};

const parseDate = (value: unknown): Date | undefined => {
  if (typeof value === 'number') {
    return new Date(value * 1000);
  }

  if (typeof value !== 'string' || !value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

const sameSecret = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Brevo (formerly Sendinblue), over its REST API. The mail log id travels in
 * the `X-Mailin-custom` header, which Brevo hands back in every webhook
 * event. Brevo signs nothing, so the webhook URL carries the configured
 * `webhookEndpointSecret` as `?key=`. Brevo retries only on 429 and timeouts
 * and drops the event on any other answer, which is why the webhook
 * controller answers 200 to whatever it cannot handle.
 */
export class BrevoMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  async sendMail(props: SendMailProps): Promise<SendMailResult> {
    const config = await this.getConfig();
    const replyTo = props.replyToAddress || config?.replyToAddress;
    const body = await this.call<{ messageId?: string }>(
      'POST',
      '/smtp/email',
      {
        sender: { email: config?.fromAddress ?? '' },
        to: [{ email: props.recipient }],
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        subject: props.subject,
        textContent: props.message,
        htmlContent: props.messageHtml,
        headers: { 'X-Mailin-custom': props.mailLogID },
      },
      `the mail to ${props.recipient}`
    );

    return body.messageId ? { providerMessageID: body.messageId } : {};
  }

  async webhookForSendMail({
    req,
  }: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    if (req.method !== 'POST') {
      return [];
    }

    const secret = (await this.getConfig())?.webhookEndpointSecret;
    const key = typeof req.query['key'] === 'string' ? req.query['key'] : '';

    if (!secret || !sameSecret(key, secret)) {
      throw new MailWebhookSignatureError('Webhook key mismatch');
    }

    const events: WebhookEvent[] = Array.isArray(req.body) ? req.body : [req.body];
    const statuses: MailLogStatus[] = [];

    for (const event of events) {
      const mailLogID = event?.['X-Mailin-custom'];
      const name = event?.event ?? '';
      const state = STATES[name] ?? null;
      const type = QUALITY[name];

      if (!mailLogID || (state === null && !type)) {
        continue;
      }

      statuses.push({
        state,
        mailLogID,
        mailData: JSON.stringify(event),
        qualitySignals:
          type ?
            [
              {
                type,
                email: event.email,
                detail: event.reason ?? null,
                occurredAt:
                  parseDate(event.ts_event) ??
                  parseDate(event.ts) ??
                  parseDate(event.date),
                providerEventId:
                  event.id !== undefined ?
                    `brevo:${event.id}:${name}`
                  : undefined,
              },
            ]
          : [],
      });
    }

    return statuses;
  }

  /**
   * One events lookup per message id (kept with the angle brackets Brevo
   * wraps it in). The newest event with a state wins; every event may still
   * say something about the address.
   */
  override async getMessageStates(
    providerMessageIDs: string[]
  ): Promise<MailProviderMessageState[]> {
    const states: MailProviderMessageState[] = [];

    for (const providerMessageID of providerMessageIDs) {
      const body = await this.call<{ events?: StatisticsEvent[] }>(
        'GET',
        `/smtp/statistics/events?messageId=${encodeURIComponent(
          providerMessageID
        )}&limit=${EVENTS_PER_MESSAGE}`
      ).catch(() => null);
      const events = (body?.events ?? [])
        .slice()
        .sort(
          (a, b) =>
            (parseDate(a.date)?.getTime() ?? 0) -
            (parseDate(b.date)?.getTime() ?? 0)
        );
      const newest = events
        .map(event => ({ event, state: STATES[event.event ?? ''] ?? null }))
        .filter(({ state }) => state !== null)
        .pop();

      if (!newest) {
        continue;
      }

      states.push({
        providerMessageID,
        state: newest.state as MailLogState,
        mailData: JSON.stringify(newest.event),
        qualitySignals: events.flatMap(event => {
          const type = QUALITY[event.event ?? ''];

          return type ?
              [
                {
                  type,
                  email: event.email,
                  detail: event.reason ?? null,
                  occurredAt: parseDate(event.date),
                },
              ]
            : [];
        }),
      });
    }

    return states;
  }

  /** Every address Brevo refuses transactional mail to, and why, paged through. */
  override async listSuppressions(): Promise<MailQualitySignal[]> {
    const signals: MailQualitySignal[] = [];

    for (let offset = 0; ; offset += PAGE) {
      const body = await this.call<{ count?: number; contacts?: BlockedContact[] }>(
        'GET',
        `/smtp/blockedContacts?limit=${PAGE}&offset=${offset}&sort=desc`
      );
      const contacts = body.contacts ?? [];

      for (const contact of contacts) {
        const email = contact.email?.trim().toLowerCase();

        if (!email) {
          continue;
        }

        signals.push({
          type:
            BLOCK_REASONS[contact.reason?.code ?? ''] ??
            EmailQualityEventType.blocked,
          email,
          detail: contact.reason?.message || contact.reason?.code || null,
          occurredAt: parseDate(contact.blockedAt),
          providerEventId: `brevo-blocked:${email}:${contact.blockedAt ?? ''}`,
        });
      }

      // Brevo says how many there are in all; stop once they are all read.
      if (!contacts.length || offset + contacts.length >= (body.count ?? 0)) {
        break;
      }
    }

    return signals;
  }

  async getTemplateContent(
    externalMailTemplateId: string
  ): Promise<MailProviderTemplateContent> {
    const template = await this.call<Template>(
      'GET',
      `/smtp/templates/${encodeURIComponent(externalMailTemplateId)}`
    );

    return { html: template.htmlContent ?? '', subject: template.subject };
  }

  override async listTemplates(): Promise<MailProviderTemplate[]> {
    const templates: MailProviderTemplate[] = [];

    for (let offset = 0; ; offset += 50) {
      const body = await this.call<{ count?: number; templates?: Template[] }>(
        'GET',
        `/smtp/templates?limit=50&offset=${offset}`
      );
      const page = body.templates ?? [];

      for (const template of page) {
        if (template.id === undefined) {
          continue;
        }

        templates.push({
          externalId: String(template.id),
          name: template.name || String(template.id),
          subject: template.subject,
          html: template.htmlContent ?? '',
        });
      }

      if (!page.length || offset + page.length >= (body.count ?? 0)) {
        return templates;
      }
    }
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'Brevo';
  }

  /** One call to Brevo's API; a non-2xx answer becomes a MailProviderError with Brevo's wording. */
  private async call<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    what = 'the request'
  ): Promise<T> {
    const config = await this.getConfig();

    if (!config?.apiKey) {
      throw new MailProviderError('Missing Brevo api key');
    }

    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        'api-key': config.apiKey,
        accept: 'application/json',
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as T & { code?: string; message?: string }) : ({} as T);

    if (!response.ok) {
      const error = parsed as { code?: string; message?: string };

      throw new MailProviderError(
        `Brevo refused ${what}: ${
          [error.code, error.message].filter(Boolean).join(': ') ||
          `${response.status} ${response.statusText}`
        }`
      );
    }

    return parsed;
  }
}
