import { APIRequestContext } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { MailpitInbox } from './mailpit';

const pdf = Buffer.from('%PDF-1.4 invoice');

const fakeRequest = (responses: Record<string, unknown>) =>
  ({
    get: async (url: string) => {
      const { pathname } = new URL(url);
      const body = responses[pathname];

      return {
        ok: () => body !== undefined,
        status: () => (body === undefined ? 404 : 200),
        json: async () => body,
        body: async () => body as Buffer,
      };
    },
  }) as unknown as APIRequestContext;

describe('MailpitInbox', () => {
  it('reads the attachments of the mail with their content', async () => {
    const inbox = new MailpitInbox(
      fakeRequest({
        '/api/v1/search': { messages: [{ ID: 'm1', Subject: 'Ihre Rechnung' }] },
        '/api/v1/message/m1': {
          ID: 'm1',
          Subject: 'Ihre Rechnung',
          To: [{ Address: 'reader@example.test' }],
          HTML: '<p>Rechnung</p>',
          Text: 'Rechnung',
          Attachments: [{ PartID: '2', FileName: 'RE-11.pdf', ContentType: 'application/pdf' }],
        },
        '/api/v1/message/m1/part/2': pdf,
      }),
      'http://mailpit.test'
    );

    const mail = await inbox.waitForMail({ to: 'reader@example.test' });

    expect(mail.attachments).toEqual([
      { filename: 'RE-11.pdf', contentType: 'application/pdf', content: pdf },
    ]);
  });

  it('has no attachments when the mail has none', async () => {
    const inbox = new MailpitInbox(
      fakeRequest({
        '/api/v1/search': { messages: [{ ID: 'm1', Subject: 'Login' }] },
        '/api/v1/message/m1': {
          ID: 'm1',
          Subject: 'Login',
          To: [{ Address: 'reader@example.test' }],
          HTML: '',
          Text: '',
        },
      }),
      'http://mailpit.test'
    );

    expect((await inbox.waitForMail({ to: 'reader@example.test' })).attachments).toEqual([]);
  });
});
