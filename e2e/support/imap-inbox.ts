import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { ImapConfig, Inbox, Mail, MailQuery, poll } from './inbox';

type Candidate = {
  uid: number;
  subject: string;
  to: string[];
  received: Date;
};

/**
 * The newest mail to exactly `to` (case-insensitive) that arrived after
 * `since` and matches `subject`. The mailbox is shared between runs and
 * developers and keeps old mails, so `since` is what tells this scenario's
 * mail apart from an earlier one to the same seeded reader.
 */
export function pickMessage(
  candidates: Candidate[],
  { to, subject, since }: { to: string; subject?: RegExp; since: Date }
): number | undefined {
  const address = to.toLowerCase();

  return candidates
    .filter(
      c =>
        c.received >= since &&
        c.to.some(recipient => recipient.toLowerCase() === address) &&
        (!subject || subject.test(c.subject))
    )
    .sort((a, b) => b.received.getTime() - a.received.getTime() || b.uid - a.uid)[0]?.uid;
}

const DAY_MS = 24 * 60 * 60 * 1000;
let purged: Promise<void> | undefined;

/**
 * Reads mails from an IMAP mailbox. On review the API sends through the
 * Ethereal SMTP account, which keeps every relayed mail, whatever the
 * recipient, in that account's INBOX; bexio's own invoice mails to an
 * @ethereal.email reader arrive there too.
 */
export class ImapInbox implements Inbox {
  private client?: ImapFlow;

  constructor(
    private readonly config: ImapConfig,
    /** Mails received before this are ignored. */
    private readonly since: Date,
    private readonly options: { purgeOlderThanDays?: number } = {}
  ) {}

  private async connect(): Promise<ImapFlow> {
    if (!this.client) {
      const client = new ImapFlow({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.port === 993,
        auth: { user: this.config.user, pass: this.config.password },
        logger: false,
      });

      await client.connect();
      this.client = client;

      if (this.options.purgeOlderThanDays) {
        purged ??= this.purgeOlderThan(client, this.options.purgeOlderThanDays);
        await purged;
      }
    }

    return this.client;
  }

  /**
   * Keeps the shared mailbox under its quota (Ethereal: 100 MB). IMAP BEFORE
   * compares whole days, hence days rather than hours.
   */
  private async purgeOlderThan(client: ImapFlow, days: number) {
    const lock = await client.getMailboxLock('INBOX');

    try {
      const old = await client.search(
        { before: new Date(Date.now() - days * DAY_MS) },
        { uid: true }
      );

      if (old && old.length) {
        await client.messageDelete(old, { uid: true });
      }
    } finally {
      lock.release();
    }
  }

  async waitForMail({ to, subject, timeout = 60_000 }: MailQuery): Promise<Mail> {
    const client = await this.connect();

    const uid = await poll(
      async () => {
        const lock = await client.getMailboxLock('INBOX');

        try {
          // A session opened before the mail arrived finds its UID but fetches
          // nothing until the client has heard about it: refresh first.
          await client.noop();
          // IMAP SINCE has day granularity; pickMessage applies the exact time.
          const uids = await client.search({ to, since: this.since }, { uid: true });

          if (!uids || !uids.length) {
            return undefined;
          }

          const candidates: Candidate[] = [];

          for await (const message of client.fetch(
            uids,
            { envelope: true, internalDate: true },
            { uid: true }
          )) {
            candidates.push({
              uid: message.uid,
              subject: message.envelope?.subject ?? '',
              to: (message.envelope?.to ?? []).map(({ address }) => address ?? ''),
              received: new Date(message.internalDate ?? 0),
            });
          }

          return pickMessage(candidates, { to, subject, since: this.since });
        } finally {
          lock.release();
        }
      },
      { timeout, interval: 2_000, message: `no mail to ${to} arrived in the IMAP inbox ${this.config.user}` }
    );

    const lock = await client.getMailboxLock('INBOX');

    try {
      const message = await client.fetchOne(String(uid), { source: true }, { uid: true });

      if (!message || !message.source) {
        throw new Error(`mail ${uid} vanished from the IMAP inbox before it could be read`);
      }

      const parsed = await simpleParser(message.source);
      // Read once, then gone: keeps the shared mailbox small.
      await client.messageDelete(String(uid), { uid: true });

      const recipients = [parsed.to ?? []].flat().flatMap(({ value }) => value.map(({ address }) => address ?? ''));

      return {
        id: String(uid),
        subject: parsed.subject ?? '',
        to: recipients,
        html: typeof parsed.html === 'string' ? parsed.html : '',
        text: parsed.text ?? '',
      };
    } finally {
      lock.release();
    }
  }

  async close() {
    await this.client?.logout().catch(() => undefined);
    this.client = undefined;
  }
}
