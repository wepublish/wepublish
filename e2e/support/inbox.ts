/**
 * Where the suite reads the mails the API sends: Mailpit on local stacks, an
 * IMAP mailbox (Ethereal) on review. Steps only see this interface; the
 * `inbox` fixture picks the backend (see `mailBackend`).
 */

export type Mail = {
  id: string;
  subject: string;
  to: string[];
  html: string;
  text: string;
};

export type MailQuery = {
  to: string;
  subject?: RegExp;
  timeout?: number;
};

export interface Inbox {
  /** Polls until a mail to `to` (and matching `subject`) arrives. */
  waitForMail(query: MailQuery): Promise<Mail>;
  close(): Promise<void>;
}

export type ImapConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
};

/** Mailpit wins when both are configured: it is the faster, local one. */
export function mailBackend(config: {
  mailpitUrl?: string;
  imap?: ImapConfig;
}): 'mailpit' | 'imap' | undefined {
  if (config.mailpitUrl) {
    return 'mailpit';
  }

  if (config.imap?.user && config.imap.password) {
    return 'imap';
  }

  return undefined;
}

/** First link in the mail whose URL matches `pattern`. */
export function extractLink(mail: Mail, pattern: RegExp): string {
  const links = [
    ...mail.html.matchAll(/href="([^"]+)"/g),
    ...mail.text.matchAll(/https?:\/\/\S+/g),
  ].map(match => (match[1] ?? match[0]).replace(/&amp;/g, '&'));
  const link = links.find(url => pattern.test(url));

  if (!link) {
    throw new Error(
      `No link matching ${pattern} in mail "${mail.subject}". Links: ${links.join(', ')}`
    );
  }

  return link;
}

/** Polls `attempt` until it returns a value or `timeout` ms have passed. */
export async function poll<T>(
  attempt: () => Promise<T | undefined>,
  { timeout, interval, message }: { timeout: number; interval: number; message: string }
): Promise<T> {
  const deadline = Date.now() + timeout;

  for (;;) {
    const result = await attempt();

    if (result !== undefined) {
      return result;
    }

    if (Date.now() >= deadline) {
      throw new Error(`${message} (waited ${timeout / 1000} s)`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}
