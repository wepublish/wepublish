import { APIRequestContext } from '@playwright/test';
import { Inbox, Mail, MailQuery, poll } from './inbox';

export type ResendConfig = {
  apiKey: string;
  apiUrl?: string;
};

type Received = {
  id: string;
  to: string[];
  subject: string;
  /** `2026-11-02 10:00:05.123456+00` */
  created_at: string;
};

/**
 * The newest mail to exactly `to` (case-insensitive) received after `since`
 * and matching `subject`. Received mails cannot be deleted, so `since` is
 * what tells this scenario's mail apart from an earlier one.
 */
export function pickReceived(
  mails: Received[],
  { to, subject, since }: { to: string; subject?: RegExp; since: Date }
): string | undefined {
  const address = to.toLowerCase();

  return mails
    .map(mail => ({ mail, received: new Date(mail.created_at) }))
    .filter(
      ({ mail, received }) =>
        received >= since &&
        mail.to.some(recipient => recipient.toLowerCase() === address) &&
        (!subject || subject.test(mail.subject))
    )
    .sort((a, b) => b.received.getTime() - a.received.getTime())[0]?.mail.id;
}

/** Mails received since midnight UTC, the day Resend's daily quota counts. */
export function receivedToday(mails: Received[], now = new Date()): number {
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return mails.filter(mail => new Date(mail.created_at).getTime() >= midnight).length;
}

/**
 * Reads mails that outside servers deliver to the Resend receiving domain
 * (`<id>.resend.app`), e.g. bexio's own invoice mails. Mails the target's API
 * sends go through its own provider (Ethereal on review) and never get here.
 */
export class ResendInbox implements Inbox {
  private readonly apiUrl: string;

  constructor(
    private readonly request: APIRequestContext,
    private readonly config: ResendConfig,
    /** Mails received before this are ignored. */
    private readonly since: Date
  ) {
    this.apiUrl = (config.apiUrl ?? 'https://api.resend.com').replace(/\/+$/, '');
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.request.get(`${this.apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });

    if (!response.ok()) {
      throw new Error(`Resend GET ${path} → HTTP ${response.status()}`);
    }

    return (await response.json()) as T;
  }

  private list() {
    // Newest first; a scenario's mail is among the last hundred.
    return this.get<{ data: Received[] }>('/emails/receiving?limit=100');
  }

  /** At most 100: a full page means the quota is used up anyway. */
  async receivedToday(now = new Date()) {
    return receivedToday((await this.list()).data, now);
  }

  async waitForMail({ to, subject, timeout = 120_000 }: MailQuery): Promise<Mail> {
    const id = await poll(
      async () => {
        const { data } = await this.list();

        return pickReceived(data, { to, subject, since: this.since });
      },
      // The API allows a few requests per second.
      { timeout, interval: 3_000, message: `no mail to ${to} arrived in the Resend inbox` }
    );

    const mail = await this.get<Received & { html: string | null; text: string | null }>(
      `/emails/receiving/${id}`
    );

    return {
      id: mail.id,
      subject: mail.subject,
      to: mail.to,
      html: mail.html ?? '',
      text: mail.text ?? '',
    };
  }

  close() {
    // Plain HTTP requests: nothing to release.
    return Promise.resolve();
  }
}
