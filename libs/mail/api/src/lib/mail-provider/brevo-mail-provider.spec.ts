import { EmailQualityEventType, MailLogState } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { BrevoMailProvider } from './brevo-mail-provider';
import {
  MailProviderError,
  MailWebhookSignatureError,
} from './mail-provider.interface';

type Call = { url: string; init: RequestInit };

const calls: Call[] = [];
const answers: Array<{ status: number; body: unknown }> = [];

const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
  calls.push({ url, init });
  const answer = answers.shift() ?? { status: 200, body: {} };

  return new Response(JSON.stringify(answer.body), {
    status: answer.status,
    headers: { 'content-type': 'application/json' },
  });
});

const harnesses: NamespacedCacheTesting[] = [];

afterEach(async () => {
  await Promise.all(harnesses.splice(0).map(testing => testing.close()));
});

const makeProvider = async (secret: string | null = 'hook-key') => {
  const testing = await createNamespacedCacheTesting();
  const kv = testing.cache;
  harnesses.push(testing);

  await kv.setNs(
    'settings:mailprovider',
    'brevo',
    {
      id: 'brevo',
      type: 'brevo',
      name: 'Brevo',
      fromAddress: 'dev@wepublish.ch',
      replyToAddress: 'reply@wepublish.ch',
      apiKey: 'xkeysib-secret',
      webhookEndpointSecret: secret,
    },
    60
  );

  return new BrevoMailProvider({ id: 'brevo', kv, prisma: {} as never });
};

const sendProps = {
  mailLogID: 'log-1',
  recipient: 'user@example.com',
  replyToAddress: 'reply@wepublish.ch',
  subject: 'Your login link',
  message: 'Hello',
  messageHtml: '<p>Hello</p>',
};

const webhook = (
  event: Record<string, unknown>,
  key: string | null = 'hook-key'
) => ({
  req: {
    method: 'POST',
    query: key === null ? {} : { key },
    body: {
      event: 'delivered',
      email: 'user@example.com',
      id: 1234,
      'message-id': '<202610211200.123@smtp-relay.mailin.fr>',
      ts_event: 1_761_048_000,
      'X-Mailin-custom': 'log-1',
      ...event,
    },
  } as never,
});

describe('BrevoMailProvider', () => {
  beforeEach(() => {
    calls.length = 0;
    answers.length = 0;
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  describe('sendMail', () => {
    it('sends the composed mail with the mail log id in a custom header and keeps the message id', async () => {
      answers.push({
        status: 201,
        body: { messageId: '<202610211200.123@smtp-relay.mailin.fr>' },
      });

      await expect((await makeProvider()).sendMail(sendProps)).resolves.toEqual(
        { providerMessageID: '<202610211200.123@smtp-relay.mailin.fr>' }
      );

      const [{ url, init }] = calls;
      expect(url).toBe('https://api.brevo.com/v3/smtp/email');
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>)['api-key']).toBe(
        'xkeysib-secret'
      );
      expect(JSON.parse(init.body as string)).toEqual({
        sender: { email: 'dev@wepublish.ch' },
        to: [{ email: 'user@example.com' }],
        replyTo: { email: 'reply@wepublish.ch' },
        subject: 'Your login link',
        textContent: 'Hello',
        htmlContent: '<p>Hello</p>',
        headers: { 'X-Mailin-custom': 'log-1' },
      });
    });

    it('says what Brevo answered when it refuses a mail', async () => {
      answers.push({
        status: 400,
        body: { code: 'invalid_parameter', message: 'sender email not valid' },
      });

      const error = await (
        await makeProvider()
      )
        .sendMail(sendProps)
        .catch(e => e);

      expect(error).toBeInstanceOf(MailProviderError);
      expect(error.message).toBe(
        'Brevo refused the mail to user@example.com: invalid_parameter: sender email not valid'
      );
    });
  });

  describe('webhookForSendMail', () => {
    it('refuses a call without the key of the URL, or without a configured secret', async () => {
      const provider = await makeProvider();

      await expect(
        provider.webhookForSendMail(webhook({}, 'wrong'))
      ).rejects.toBeInstanceOf(MailWebhookSignatureError);
      await expect(
        provider.webhookForSendMail(webhook({}, null))
      ).rejects.toBeInstanceOf(MailWebhookSignatureError);
      await expect(
        (await makeProvider(null)).webhookForSendMail(webhook({}))
      ).rejects.toBeInstanceOf(MailWebhookSignatureError);
    });

    it.each([
      ['request', MailLogState.submitted],
      ['delivered', MailLogState.delivered],
      ['deferred', MailLogState.deferred],
      ['soft_bounce', MailLogState.deferred],
      ['hard_bounce', MailLogState.bounced],
      ['invalid_email', MailLogState.bounced],
      ['blocked', MailLogState.rejected],
      ['error', MailLogState.rejected],
    ])('maps the event %s onto %s', async (event, state) => {
      const [status] = await (
        await makeProvider()
      ).webhookForSendMail(webhook({ event }));

      expect(status).toMatchObject({ mailLogID: 'log-1', state });
    });

    it.each([
      ['hard_bounce', EmailQualityEventType.hardBounce],
      ['invalid_email', EmailQualityEventType.invalid],
      ['blocked', EmailQualityEventType.blocked],
      ['spam', EmailQualityEventType.spamComplaint],
      ['unsubscribed', EmailQualityEventType.unsubscribed],
      ['click', EmailQualityEventType.clicked],
    ])('reports what %s says about the address', async (event, type) => {
      const [status] = await (
        await makeProvider()
      ).webhookForSendMail(webhook({ event, reason: 'mailbox not found' }));

      expect(status.qualitySignals).toEqual([
        {
          type,
          email: 'user@example.com',
          detail: 'mailbox not found',
          occurredAt: new Date(1_761_048_000 * 1000),
          providerEventId: `brevo:1234:${event}`,
        },
      ]);
    });

    it('reports a complaint without touching the delivery state', async () => {
      const [status] = await (
        await makeProvider()
      ).webhookForSendMail(webhook({ event: 'spam' }));

      expect(status.state).toBeNull();
    });

    it.each(['opened', 'unique_opened', 'loaded_by_proxy'])(
      'drops a %s event, which proves nothing',
      async event => {
        await expect(
          (await makeProvider()).webhookForSendMail(webhook({ event }))
        ).resolves.toEqual([]);
      }
    );

    it('drops an event without a mail log id', async () => {
      await expect(
        (await makeProvider()).webhookForSendMail(
          webhook({ 'X-Mailin-custom': undefined })
        )
      ).resolves.toEqual([]);
    });

    it('answers nothing to anything but a POST', async () => {
      await expect(
        (await makeProvider()).webhookForSendMail({
          req: { method: 'GET', query: {}, body: undefined } as never,
        })
      ).resolves.toEqual([]);
    });
  });

  describe('getMessageStates', () => {
    const event = (overrides: Record<string, unknown>) => ({
      email: 'user@example.com',
      date: '2026-10-21T12:00:00.000Z',
      messageId: '<m1@smtp-relay.mailin.fr>',
      event: 'delivered',
      ...overrides,
    });

    it('asks the events of each message and reports the newest state', async () => {
      answers.push({
        status: 200,
        body: {
          events: [
            event({ event: 'delivered', date: '2026-10-21T12:00:00.000Z' }),
            event({ event: 'requests', date: '2026-10-21T11:00:00.000Z' }),
          ],
        },
      });

      const states = await (
        await makeProvider()
      ).getMessageStates(['<m1@smtp-relay.mailin.fr>']);

      expect(calls[0].url).toBe(
        `https://api.brevo.com/v3/smtp/statistics/events?messageId=${encodeURIComponent(
          '<m1@smtp-relay.mailin.fr>'
        )}&limit=100`
      );
      expect(states).toEqual([
        expect.objectContaining({
          providerMessageID: '<m1@smtp-relay.mailin.fr>',
          state: MailLogState.delivered,
          qualitySignals: [],
        }),
      ]);
    });

    it('tells a hard bounce from a soft one and keeps what every event says', async () => {
      answers.push({
        status: 200,
        body: {
          events: [
            event({ event: 'softBounces', date: '2026-10-21T10:00:00.000Z' }),
            event({
              event: 'hardBounces',
              reason: 'user unknown',
              date: '2026-10-21T12:00:00.000Z',
            }),
          ],
        },
      });

      const [state] = await (await makeProvider()).getMessageStates(['<m1@x>']);

      expect(state.state).toBe(MailLogState.bounced);
      expect(state.qualitySignals).toEqual([
        expect.objectContaining({
          type: EmailQualityEventType.hardBounce,
          detail: 'user unknown',
          occurredAt: new Date('2026-10-21T12:00:00.000Z'),
        }),
      ]);
    });

    it('skips a message Brevo has no events for and keeps going', async () => {
      answers.push({ status: 200, body: { events: [] } });
      answers.push({ status: 200, body: { events: [event({})] } });

      const states = await (
        await makeProvider()
      ).getMessageStates(['<gone@x>', '<m2@x>']);

      expect(states.map(({ providerMessageID }) => providerMessageID)).toEqual([
        '<m2@x>',
      ]);
    });
  });

  describe('listSuppressions', () => {
    it('reads the blocked contacts and why Brevo blocked them, page by page', async () => {
      answers.push({
        status: 200,
        body: {
          count: 3,
          contacts: [
            {
              email: 'Dead@Example.com',
              reason: { code: 'hardBounce', message: 'Hard bounce' },
              blockedAt: '2026-10-20T10:15:00.000+00:00',
            },
            {
              email: 'angry@example.com',
              reason: { code: 'contactFlaggedAsSpam', message: 'Spam' },
              blockedAt: '2026-10-19T08:00:00.000+00:00',
            },
          ],
        },
      });
      answers.push({
        status: 200,
        body: {
          count: 3,
          contacts: [
            {
              email: 'gone@example.com',
              reason: { code: 'unsubscribedViaEmail', message: 'Unsubscribed' },
              blockedAt: '2026-10-18T08:00:00.000+00:00',
            },
          ],
        },
      });

      const signals = await (await makeProvider()).listSuppressions();

      expect(calls[0].url).toBe(
        'https://api.brevo.com/v3/smtp/blockedContacts?limit=500&offset=0&sort=desc'
      );
      expect(calls[1].url).toContain('offset=500');
      expect(signals).toEqual([
        {
          type: EmailQualityEventType.hardBounce,
          email: 'dead@example.com',
          detail: 'Hard bounce',
          occurredAt: new Date('2026-10-20T10:15:00.000Z'),
          providerEventId:
            'brevo-blocked:dead@example.com:2026-10-20T10:15:00.000+00:00',
        },
        expect.objectContaining({
          type: EmailQualityEventType.spamComplaint,
          email: 'angry@example.com',
        }),
        // Brevo refuses every further transactional mail to them.
        expect.objectContaining({
          type: EmailQualityEventType.unsubscribed,
          email: 'gone@example.com',
        }),
      ]);
    });

    it('reads an address an admin blocked as blocked', async () => {
      answers.push({
        status: 200,
        body: {
          count: 1,
          contacts: [
            {
              email: 'x@example.com',
              reason: { code: 'adminBlocked', message: 'Blocked by admin' },
              blockedAt: '2026-10-18T08:00:00.000+00:00',
            },
          ],
        },
      });

      const [signal] = await (await makeProvider()).listSuppressions();

      expect(signal).toMatchObject({
        type: EmailQualityEventType.blocked,
        detail: 'Blocked by admin',
      });
    });
  });

  describe('templates', () => {
    it('lists the remote templates with their content', async () => {
      answers.push({
        status: 200,
        body: {
          count: 1,
          templates: [
            { id: 7, name: 'Welcome', subject: 'Hi', htmlContent: '<p>Hi</p>' },
          ],
        },
      });

      await expect((await makeProvider()).listTemplates()).resolves.toEqual([
        { externalId: '7', name: 'Welcome', subject: 'Hi', html: '<p>Hi</p>' },
      ]);
    });

    it('fetches one template', async () => {
      answers.push({
        status: 200,
        body: { id: 7, subject: 'Hi', htmlContent: '<p>Hi</p>' },
      });

      await expect(
        (await makeProvider()).getTemplateContent('7')
      ).resolves.toEqual({ html: '<p>Hi</p>', subject: 'Hi' });
      expect(calls[0].url).toBe('https://api.brevo.com/v3/smtp/templates/7');
    });
  });
});
