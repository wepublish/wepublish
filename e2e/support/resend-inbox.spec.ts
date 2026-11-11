import { APIRequestContext } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { pickReceived, receivedToday, ResendInbox } from './resend-inbox';

const since = new Date('2026-11-02T10:00:00Z');
const received = (id: string, over: Partial<Parameters<typeof pickReceived>[0][number]> = {}) => ({
  id,
  to: ['nw-00001@abc.resend.app'],
  subject: 'Rechnung',
  created_at: '2026-11-02 10:00:05.123456+00',
  ...over,
});

describe('pickReceived', () => {
  it('takes the newest mail to the recipient', () => {
    const mails = [received('a'), received('b', { created_at: '2026-11-02 10:00:09+00' })];

    expect(pickReceived(mails, { to: 'nw-00001@abc.resend.app', since })).toBe('b');
  });

  it('matches the recipient exactly, ignoring case', () => {
    const mails = [received('a', { to: ['nw-000011@abc.resend.app'] }), received('b', { to: ['NW-00001@abc.resend.app'] })];

    expect(pickReceived(mails, { to: 'nw-00001@abc.resend.app', since })).toBe('b');
  });

  it('ignores mails received before the scenario started', () => {
    expect(
      pickReceived([received('a', { created_at: '2026-11-02 09:59:59+00' })], { to: 'nw-00001@abc.resend.app', since })
    ).toBeUndefined();
  });

  it('filters by subject when asked', () => {
    const mails = [received('a', { subject: 'Mahnung' }), received('b', { subject: 'Rechnung' })];

    expect(pickReceived(mails, { to: 'nw-00001@abc.resend.app', subject: /Mahnung/, since })).toBe('a');
  });
});

describe('receivedToday', () => {
  it('counts the mails received since midnight UTC, the quota day', () => {
    const mails = [
      received('a', { created_at: '2026-11-02 00:00:01+00' }),
      received('b', { created_at: '2026-11-02 09:00:00+00' }),
      received('c', { created_at: '2026-11-01 23:59:59+00' }),
    ];

    expect(receivedToday(mails, new Date('2026-11-02T10:00:00Z'))).toBe(2);
  });
});

describe('ResendInbox', () => {
  const fakeRequest = (responses: Record<string, unknown>, calls: { url: string; auth?: string }[] = []) =>
    ({
      get: async (url: string, options?: { headers?: Record<string, string> }) => {
        calls.push({ url, auth: options?.headers?.Authorization });
        const path = new URL(url).pathname;

        return { ok: () => true, status: () => 200, json: async () => responses[path] };
      },
    }) as unknown as APIRequestContext;

  it('lists the received mails, then reads the chosen one with the API key', async () => {
    const calls: { url: string; auth?: string }[] = [];
    const request = fakeRequest(
      {
        '/emails/receiving': { data: [received('b'), received('a', { to: ['other@abc.resend.app'] })] },
        '/emails/receiving/b': { ...received('b'), html: '<a href="https://x.test/pay">Pay</a>', text: 'Pay' },
      },
      calls
    );

    const mail = await new ResendInbox(request, { apiKey: 're_test' }, since).waitForMail({
      to: 'nw-00001@abc.resend.app',
      timeout: 1_000,
    });

    expect(mail).toEqual({
      id: 'b',
      subject: 'Rechnung',
      to: ['nw-00001@abc.resend.app'],
      html: '<a href="https://x.test/pay">Pay</a>',
      text: 'Pay',
    });
    expect(calls.map(c => c.url)).toEqual([
      'https://api.resend.com/emails/receiving?limit=100',
      'https://api.resend.com/emails/receiving/b',
    ]);
    expect(calls.every(c => c.auth === 'Bearer re_test')).toBe(true);
  });

  it('counts what arrived today for the quota check', async () => {
    const request = fakeRequest({
      '/emails/receiving': {
        data: [received('a'), received('b', { created_at: '2026-11-01 12:00:00+00' })],
      },
    });

    expect(
      await new ResendInbox(request, { apiKey: 're_test' }, since).receivedToday(new Date('2026-11-02T12:00:00Z'))
    ).toBe(1);
  });

  it('names the recipient when nothing arrives', async () => {
    const request = fakeRequest({ '/emails/receiving': { data: [] } });

    await expect(
      new ResendInbox(request, { apiKey: 're_test' }, since).waitForMail({ to: 'nw-00001@abc.resend.app', timeout: 0 })
    ).rejects.toThrow(/no mail to nw-00001@abc.resend.app arrived in the Resend inbox/);
  });
});
