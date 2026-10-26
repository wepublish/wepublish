import { APIRequestContext, expect } from '@playwright/test';
import { env } from './env';

export type Mail = {
  ID: string;
  Subject: string;
  To: { Address: string }[];
  HTML: string;
  Text: string;
};

/** Reads mails the API sent to mailpit (docker-compose service `mailpit`). */
export class Inbox {
  constructor(private readonly request: APIRequestContext) {}

  private get url() {
    if (!env.mailpitUrl) {
      throw new Error('MAILPIT_URL is not set; tag the scenario with @mail.');
    }

    return env.mailpitUrl;
  }

  /** Polls until a mail to `to` (and matching `subject`) arrives. */
  async waitForMail({
    to,
    subject,
    timeout = 30_000,
  }: {
    to: string;
    subject?: RegExp;
    timeout?: number;
  }) {
    let id: string | undefined;

    await expect
      .poll(
        async () => {
          const response = await this.request.get(`${this.url}/api/v1/search`, {
            params: { query: `to:"${to}"` },
          });
          const { messages } = (await response.json()) as {
            messages: { ID: string; Subject: string }[];
          };
          id = messages.find(m => !subject || subject.test(m.Subject))?.ID;

          return id;
        },
        { message: `no mail to ${to} arrived in mailpit`, timeout }
      )
      .toBeTruthy();

    const response = await this.request.get(`${this.url}/api/v1/message/${id}`);

    return (await response.json()) as Mail;
  }

  /** First link in the mail whose URL matches `pattern`. */
  extractLink(mail: Mail, pattern: RegExp) {
    const links = [
      ...mail.HTML.matchAll(/href="([^"]+)"/g),
      ...mail.Text.matchAll(/https?:\/\/\S+/g),
    ].map(match => (match[1] ?? match[0]).replace(/&amp;/g, '&'));
    const link = links.find(url => pattern.test(url));

    if (!link) {
      throw new Error(
        `No link matching ${pattern} in mail "${mail.Subject}". Links: ${links.join(', ')}`
      );
    }

    return link;
  }
}
