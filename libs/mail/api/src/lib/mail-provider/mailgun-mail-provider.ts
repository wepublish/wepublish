import { EmailQualityEventType, MailLogState } from '@prisma/client';
import crypto from 'crypto';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
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

interface VerifyWebhookSignatureProps {
  timestamp: string;
  token: string;
  signature: string;
}

function mapMailgunEventToMailLogState(event: string): MailLogState | null {
  switch (event) {
    case 'accepted':
      return MailLogState.accepted;
    case 'delivered':
      return MailLogState.delivered;
    case 'failed':
      return MailLogState.bounced;
    case 'rejected':
      return MailLogState.rejected;
    default:
      return null;
  }
}

/**
 * The polled events carry the severity, so a temporary failure Mailgun will
 * retry does not count as a bounce there.
 */
function mapPolledEventToMailLogState(
  data: MailgunEventData
): MailLogState | null {
  if (data.event === 'failed' && data.severity === 'temporary') {
    return MailLogState.deferred;
  }

  return mapMailgunEventToMailLogState(data.event ?? '');
}

/** The one page size Mailgun's list endpoints accept at most. */
const SUPPRESSION_PAGE = 1000;

/** How many events to read per message; a mail rarely has more than a handful. */
const EVENTS_PER_MESSAGE = 300;

type MailgunSuppression = {
  address?: string;
  code?: number | string;
  error?: string;
  tags?: unknown;
  created_at?: string | Date;
};

const suppressionDate = (
  value: string | Date | undefined
): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * What an entry of one of Mailgun's suppression lists says about the address.
 * A domain-wide unsubscribe (tag `*`) makes Mailgun refuse every mail, so it
 * is as dead as a bounce; an unsubscribe from a tag is the person's choice.
 */
function mapSuppressionToQualitySignal(
  list: 'bounces' | 'complaints' | 'unsubscribes',
  entry: MailgunSuppression
): MailQualitySignal | null {
  const email = entry.address?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const occurredAt = suppressionDate(entry.created_at);
  const tags =
    Array.isArray(entry.tags) ?
      entry.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];
  const domainWide = !tags.length || tags.includes('*');
  const [type, detail, kind]: [EmailQualityEventType, string | null, string] =
    list === 'bounces' ?
      [EmailQualityEventType.hardBounce, entry.error || null, 'bounce']
    : list === 'complaints' ?
      [EmailQualityEventType.spamComplaint, null, 'complaint']
    : domainWide ? [EmailQualityEventType.unsubscribed, null, 'unsubscribe']
    : [
        EmailQualityEventType.optedOut,
        `mailgun:${tags.join(',')}`,
        'unsubscribe',
      ];

  return {
    type,
    email,
    detail,
    occurredAt,
    providerEventId: `mailgun-${kind}:${email}:${
      occurredAt?.toISOString() ?? ''
    }`,
  };
}

type MailgunEventData = {
  id?: string;
  event?: string;
  severity?: string;
  reason?: string;
  recipient?: string;
  timestamp?: number;
  'delivery-status'?: { description?: string; message?: string };
};

/**
 * What an event says about the recipient's address, besides the delivery
 * state. A temporary failure is retried by Mailgun and may still get through;
 * an open proves nothing.
 */
function mapMailgunEventToQualitySignal(
  data: MailgunEventData
): MailQualitySignal | null {
  const signal = (
    type: EmailQualityEventType,
    detail?: string | null
  ): MailQualitySignal => ({
    type,
    email: data.recipient,
    detail: detail ?? null,
    occurredAt:
      typeof data.timestamp === 'number' ?
        new Date(data.timestamp * 1000)
      : undefined,
    providerEventId: data.id ? `mailgun:${data.id}` : undefined,
  });

  switch (data.event) {
    case 'failed':
      return data.severity === 'permanent' ?
          signal(
            EmailQualityEventType.hardBounce,
            data['delivery-status']?.description ||
              data['delivery-status']?.message ||
              data.reason
          )
        : null;
    case 'rejected':
      return signal(EmailQualityEventType.blocked, data.reason);
    case 'complained':
      return signal(EmailQualityEventType.spamComplaint);
    case 'unsubscribed':
      return signal(EmailQualityEventType.unsubscribed);
    case 'clicked':
      return signal(EmailQualityEventType.clicked);
    default:
      return null;
  }
}

export class MailgunMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  async verifyWebhookSignature(
    props: VerifyWebhookSignatureProps
  ): Promise<boolean> {
    const config = await this.getConfig();
    const encodedToken = crypto
      .createHmac('sha256', config?.webhookEndpointSecret ?? '')
      .update(props.timestamp.concat(props.token))
      .digest('hex');

    return encodedToken === props.signature;
  }

  async webhookForSendMail({
    req,
  }: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    const { body } = req;

    if (!body.signature) {
      throw new Error('No signature in webhook body');
    }

    const { signature, token, timestamp } =
      body.signature as VerifyWebhookSignatureProps;

    if (
      !timestamp ||
      !token ||
      !signature ||
      !(await this.verifyWebhookSignature({ timestamp, token, signature }))
    ) {
      throw new MailWebhookSignatureError('Webhook signature failed');
    }

    if (!body['event-data']) {
      throw new Error('No event-data in webhook body');
    }

    if (!body['event-data']['user-variables']) {
      throw new Error('No user-variables in webhook body');
    }

    const mailLogStatuses: MailLogStatus[] = [];
    const state = mapMailgunEventToMailLogState(body['event-data'].event);
    const signal = mapMailgunEventToQualitySignal(body['event-data']);
    const mailLogID = body['event-data']['user-variables'].mail_log_id;

    if ((state !== null || signal) && mailLogID !== undefined) {
      mailLogStatuses.push({
        state,
        mailLogID,
        mailData: JSON.stringify(body['event-data']),
        qualitySignals: signal ? [signal] : [],
      });
    }

    return mailLogStatuses;
  }

  /**
   * Mailgun answers an accepted mail with its Message-Id, kept so the delivery
   * state can be polled from the events API when the webhook never arrives.
   */
  async sendMail(props: SendMailProps): Promise<SendMailResult> {
    const config = await this.getConfig();
    const form = new FormData();
    form.append('from', config?.fromAddress ?? '');
    form.append('to', props.recipient);
    form.append('subject', props.subject);
    form.append('text', props.message ?? '');

    if (props.messageHtml) {
      form.append('html', props.messageHtml);
    }

    const auth = Buffer.from(`api:${config?.apiKey}`).toString('base64');
    form.append('v:mail_log_id', props.mailLogID);
    return new Promise((resolve, reject) => {
      form.submit(
        {
          protocol: 'https:',
          host: config?.mailgun_baseDomain,
          path: `/v3/${config?.mailgun_mailDomain}/messages`,
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${auth}`,
          },
        },
        (err, res) => {
          if (err) {
            return reject(err);
          }

          if (res.statusCode !== 200) {
            res.resume();

            return reject(
              new MailProviderError(
                `Mailgun refused the mail to ${props.recipient}: ${res.statusCode} ${res.statusMessage}`
              )
            );
          }

          // The events API knows the id without the angle brackets the
          // answer wraps it in.
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk: string) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              const id = (JSON.parse(body) as { id?: unknown }).id;

              resolve(
                typeof id === 'string' && id ?
                  { providerMessageID: id.replace(/^<|>$/g, '') }
                : {}
              );
            } catch {
              resolve({});
            }
          });
        }
      );
    });
  }

  /**
   * One events lookup per message. The newest event with a state wins; every
   * event may still say something about the address (a complaint after a
   * delivery). Messages Mailgun has no events for any more are skipped.
   */
  override async getMessageStates(
    providerMessageIDs: string[]
  ): Promise<MailProviderMessageState[]> {
    const { client, mailDomain } = await this.getMailgunClient();
    const states: MailProviderMessageState[] = [];

    for (const providerMessageID of providerMessageIDs) {
      const result = await client.events
        .get(mailDomain, {
          'message-id': providerMessageID,
          limit: EVENTS_PER_MESSAGE,
        })
        .catch(() => null);
      const events = ((result?.items ?? []) as MailgunEventData[])
        .slice()
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
      const newest = events
        .map(data => ({ data, state: mapPolledEventToMailLogState(data) }))
        .filter(({ state }) => state !== null)
        .pop();

      if (!newest) {
        continue;
      }

      states.push({
        providerMessageID,
        state: newest.state as MailLogState,
        mailData: JSON.stringify(newest.data),
        qualitySignals: events.flatMap(data => {
          const signal = mapMailgunEventToQualitySignal(data);

          return signal ? [signal] : [];
        }),
      });
    }

    return states;
  }

  /** Bounces, complaints and unsubscribes of the sending domain, paged through. */
  override async listSuppressions(): Promise<MailQualitySignal[]> {
    const { client, mailDomain } = await this.getMailgunClient();
    const signals: MailQualitySignal[] = [];

    for (const list of ['bounces', 'complaints', 'unsubscribes'] as const) {
      let page: string | undefined;

      for (;;) {
        const result = await client.suppressions.list(mailDomain, list, {
          limit: SUPPRESSION_PAGE,
          ...(page ? { page } : {}),
        });
        const items = (result.items ?? []) as MailgunSuppression[];

        for (const entry of items) {
          const signal = mapSuppressionToQualitySignal(list, entry);

          if (signal) {
            signals.push(signal);
          }
        }

        const next = result.pages?.next?.page as string | undefined;
        if (!items.length || !next || next === page) {
          break;
        }
        page = next;
      }
    }

    return signals;
  }

  async getTemplateContent(
    externalMailTemplateId: string
  ): Promise<MailProviderTemplateContent> {
    const { client, mailDomain } = await this.getMailgunClient();
    const response = await client.domains.domainTemplates.get(
      mailDomain,
      externalMailTemplateId,
      { active: 'yes' } as never
    );
    return { html: response.version?.template ?? '' };
  }

  /**
   * Mailgun's template list is shallow and paginated (10 per page by default),
   * so page through it and fetch each template's active version separately.
   * Mailgun templates carry no subject — the local one is kept on import.
   */
  override async listTemplates(): Promise<MailProviderTemplate[]> {
    const { client, mailDomain } = await this.getMailgunClient();
    const names: string[] = [];
    let page: `?${string}` | undefined = undefined;

    for (;;) {
      const result = await client.domains.domainTemplates.list(mailDomain, {
        limit: 100,
        ...(page ? { page } : {}),
      });
      const items = result.items ?? [];
      names.push(...items.map(item => item.name));

      const next = result.pages?.next?.page as `?${string}` | undefined;
      if (!items.length || !next || next === page) {
        break;
      }
      page = next;
    }

    const templates: MailProviderTemplate[] = [];
    for (const name of names) {
      const content = await this.getTemplateContent(name);
      templates.push({ externalId: name, name, html: content.html });
    }

    return templates;
  }

  private async getMailgunClient() {
    const config = await this.getConfig();
    if (!config?.apiKey || !config?.mailgun_baseDomain) {
      throw new Error('Missing mailgun base domain or api key');
    }

    return {
      client: new Mailgun(FormData).client({
        username: 'api',
        key: config.apiKey,
        url: `https://${config.mailgun_baseDomain}`,
      }),
      mailDomain: config.mailgun_mailDomain ?? '',
    };
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
