import { APIRequestContext } from '@playwright/test';
import { Inbox, Mail, MailQuery, poll } from './inbox';

type MailpitMessage = {
  ID: string;
  Subject: string;
  To: { Address: string }[];
  HTML: string;
  Text: string;
};

/** Reads mails the API sent to mailpit (docker-compose service `mailpit`). */
export class MailpitInbox implements Inbox {
  constructor(
    private readonly request: APIRequestContext,
    private readonly url: string
  ) {}

  async waitForMail({ to, subject, timeout = 30_000 }: MailQuery): Promise<Mail> {
    const id = await poll(
      async () => {
        const response = await this.request.get(`${this.url}/api/v1/search`, {
          params: { query: `to:"${to}"` },
        });
        const { messages } = (await response.json()) as {
          messages: { ID: string; Subject: string }[];
        };

        return messages.find(m => !subject || subject.test(m.Subject))?.ID;
      },
      { timeout, interval: 500, message: `no mail to ${to} arrived in mailpit` }
    );

    const response = await this.request.get(`${this.url}/api/v1/message/${id}`);
    const message = (await response.json()) as MailpitMessage;

    return {
      id: message.ID,
      subject: message.Subject,
      to: message.To.map(({ Address }) => Address),
      html: message.HTML,
      text: message.Text,
    };
  }

  close() {
    // Plain HTTP requests: nothing to release.
    return Promise.resolve();
  }
}
