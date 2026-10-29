import { createHmac } from 'crypto';
import { EmailQualityEventType, MailLogState } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import {
  MailProviderError,
  MailWebhookSignatureError,
} from './mail-provider.interface';
import { MailgunMailProvider } from './mailgun-mail-provider';

const { answer, mailgunClient } = vi.hoisted(() => ({
  answer: {
    error: null as Error | null,
    response: { statusCode: 200, statusMessage: 'OK' },
    body: '{"id":"<20261021.abc@mg.wepublish.ch>","message":"Queued. Thank you."}',
  },
  mailgunClient: {
    events: { get: vi.fn() },
    suppressions: { list: vi.fn() },
  },
}));

vi.mock('form-data', () => ({
  default: class {
    append() {
      return undefined;
    }

    submit(
      _options: unknown,
      callback: (error: Error | null, response: unknown) => void
    ) {
      // Enough of an IncomingMessage to read the answer's body from.
      const listeners: Record<string, (chunk?: string) => void> = {};
      const response = {
        ...answer.response,
        resume: () => undefined,
        setEncoding: () => undefined,
        on(event: string, listener: (chunk?: string) => void) {
          listeners[event] = listener;

          if (event === 'end') {
            listeners['data']?.(answer.body);
            listener();
          }

          return response;
        },
      };

      callback(answer.error, response);
    }
  },
}));

vi.mock('mailgun.js', () => ({
  default: class {
    client() {
      return mailgunClient;
    }
  },
}));

const harnesses: NamespacedCacheTesting[] = [];

afterEach(async () => {
  await Promise.all(harnesses.splice(0).map(testing => testing.close()));
});

const makeProvider = async () => {
  const testing = await createNamespacedCacheTesting();
  const kv = testing.cache;
  harnesses.push(testing);

  await kv.setNs(
    'settings:mailprovider',
    'mailgun',
    {
      id: 'mailgun',
      type: 'mailgun',
      name: 'Mailgun',
      fromAddress: 'dev@wepublish.ch',
      apiKey: 'key',
      mailgun_baseDomain: 'api.eu.mailgun.net',
      mailgun_mailDomain: 'mg.wepublish.ch',
      webhookEndpointSecret: 'webhook-key',
    },
    60
  );

  return new MailgunMailProvider({ id: 'mailgun', kv, prisma: {} as never });
};

const sendProps = {
  mailLogID: 'log-1',
  recipient: 'user@example.com',
  replyToAddress: 'dev@wepublish.ch',
  subject: 'Your login link',
  message: 'Hello',
};

describe('MailgunMailProvider', () => {
  afterEach(() => {
    answer.error = null;
    answer.response = { statusCode: 200, statusMessage: 'OK' };
  });

  it('sends a mail Mailgun accepted and keeps its Message-Id for polling, without the brackets', async () => {
    const provider = await makeProvider();

    await expect(provider.sendMail(sendProps)).resolves.toEqual({
      providerMessageID: '20261021.abc@mg.wepublish.ch',
    });
  });

  it('still counts the mail as sent when the answer carries no id', async () => {
    answer.body = 'not json';
    const provider = await makeProvider();

    await expect(provider.sendMail(sendProps)).resolves.toEqual({});
    answer.body =
      '{"id":"<20261021.abc@mg.wepublish.ch>","message":"Queued. Thank you."}';
  });

  it('says what Mailgun answered when it refuses a mail', async () => {
    answer.response = { statusCode: 401, statusMessage: 'UNAUTHORIZED' };
    const provider = await makeProvider();

    const error = await provider.sendMail(sendProps).catch(e => e);

    expect(error).toBeInstanceOf(MailProviderError);
    expect(error.message).toBe(
      'Mailgun refused the mail to user@example.com: 401 UNAUTHORIZED'
    );
  });

  it('passes on why it could not reach Mailgun', async () => {
    answer.error = new Error('getaddrinfo ENOTFOUND api.eu.mailgun.net');
    const provider = await makeProvider();

    await expect(provider.sendMail(sendProps)).rejects.toThrow(
      'getaddrinfo ENOTFOUND api.eu.mailgun.net'
    );
  });
});

describe('MailgunMailProvider webhook', () => {
  const request = (
    eventData: Record<string, unknown>,
    secret = 'webhook-key'
  ) => {
    const timestamp = '1790000000';
    const token = 'token';

    return {
      req: {
        body: {
          signature: {
            timestamp,
            token,
            signature: createHmac('sha256', secret)
              .update(timestamp + token)
              .digest('hex'),
          },
          'event-data': {
            recipient: 'jane@example.com',
            timestamp: 1790000000,
            'user-variables': { mail_log_id: 'log-1' },
            ...eventData,
          },
        },
      } as never,
    };
  };

  it('refuses a webhook that was not signed with the webhook key', async () => {
    const provider = await makeProvider();

    await expect(
      provider.webhookForSendMail(request({ event: 'delivered' }, 'forged'))
    ).rejects.toBeInstanceOf(MailWebhookSignatureError);
  });

  it('accepts a webhook signed with the webhook key', async () => {
    const provider = await makeProvider();

    await expect(
      provider.webhookForSendMail(request({ event: 'delivered' }))
    ).resolves.toEqual([
      expect.objectContaining({ mailLogID: 'log-1', state: 'delivered' }),
    ]);
  });

  it('reports a permanent failure as a hard bounce', async () => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail(
      request({
        id: 'evt-1',
        event: 'failed',
        severity: 'permanent',
        'delivery-status': { description: 'mailbox unavailable' },
      })
    );

    expect(status.state).toBe(MailLogState.bounced);
    expect(status.qualitySignals).toEqual([
      {
        type: EmailQualityEventType.hardBounce,
        email: 'jane@example.com',
        detail: 'mailbox unavailable',
        occurredAt: new Date(1790000000 * 1000),
        providerEventId: 'mailgun:evt-1',
      },
    ]);
  });

  // Mailgun retries a temporary failure; the mail may still get through.
  it('reports a temporary failure only as a state', async () => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail(request({ event: 'failed', severity: 'temporary' }));

    expect(status.state).toBe(MailLogState.bounced);
    expect(status.qualitySignals).toEqual([]);
  });

  it('reports a rejection as blocked', async () => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail(request({ event: 'rejected', reason: 'suppressed' }));

    expect(status.state).toBe(MailLogState.rejected);
    expect(status.qualitySignals).toEqual([
      expect.objectContaining({
        type: EmailQualityEventType.blocked,
        detail: 'suppressed',
      }),
    ]);
  });

  it.each([
    ['complained', EmailQualityEventType.spamComplaint],
    ['unsubscribed', EmailQualityEventType.unsubscribed],
    ['clicked', EmailQualityEventType.clicked],
  ])('reports %s without touching the delivery state', async (event, type) => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail(request({ id: 'evt-2', event }));

    expect(status.state).toBeNull();
    expect(status.qualitySignals).toEqual([
      expect.objectContaining({ type, providerEventId: 'mailgun:evt-2' }),
    ]);
  });

  it('reports nothing about a plain delivery or an open', async () => {
    const provider = await makeProvider();
    const [delivered] = await provider.webhookForSendMail(
      request({ event: 'delivered' })
    );

    expect(delivered.state).toBe(MailLogState.delivered);
    expect(delivered.qualitySignals).toEqual([]);
    await expect(
      provider.webhookForSendMail(request({ event: 'opened' }))
    ).resolves.toEqual([]);
  });
});

describe('MailgunMailProvider getMessageStates', () => {
  const event = (overrides: Record<string, unknown> = {}) => ({
    id: 'evt-1',
    event: 'delivered',
    recipient: 'user@example.com',
    timestamp: 1_760_000_000,
    severity: undefined,
    ...overrides,
  });

  beforeEach(() => {
    mailgunClient.events.get.mockReset();
  });

  it('asks the events of each message on the sending domain', async () => {
    mailgunClient.events.get.mockResolvedValue({ items: [] });

    await (await makeProvider()).getMessageStates(['m1', 'm2']);

    expect(mailgunClient.events.get).toHaveBeenCalledTimes(2);
    expect(mailgunClient.events.get).toHaveBeenCalledWith(
      'mg.wepublish.ch',
      expect.objectContaining({ 'message-id': 'm1' })
    );
  });

  it('reports the newest delivery event as the state', async () => {
    mailgunClient.events.get.mockResolvedValue({
      items: [
        event({ id: 'a', event: 'accepted', timestamp: 100 }),
        event({ id: 'b', event: 'delivered', timestamp: 200 }),
      ],
    });

    await expect(
      (await makeProvider()).getMessageStates(['m1'])
    ).resolves.toEqual([
      expect.objectContaining({
        providerMessageID: 'm1',
        state: MailLogState.delivered,
        qualitySignals: [],
      }),
    ]);
  });

  it('tells a temporary failure from a permanent one', async () => {
    mailgunClient.events.get
      .mockResolvedValueOnce({
        items: [event({ event: 'failed', severity: 'temporary' })],
      })
      .mockResolvedValueOnce({
        items: [
          event({
            event: 'failed',
            severity: 'permanent',
            'delivery-status': { description: 'user unknown' },
          }),
        ],
      });
    const provider = await makeProvider();

    const [deferred] = await provider.getMessageStates(['m1']);
    const [bounced] = await provider.getMessageStates(['m2']);

    expect(deferred.state).toBe(MailLogState.deferred);
    expect(deferred.qualitySignals).toEqual([]);
    expect(bounced.state).toBe(MailLogState.bounced);
    expect(bounced.qualitySignals).toEqual([
      expect.objectContaining({
        type: EmailQualityEventType.hardBounce,
        detail: 'user unknown',
        providerEventId: 'mailgun:evt-1',
      }),
    ]);
  });

  it('collects what every event says about the address, even without a state change', async () => {
    mailgunClient.events.get.mockResolvedValue({
      items: [
        event({ id: 'a', event: 'delivered', timestamp: 100 }),
        event({ id: 'b', event: 'complained', timestamp: 300 }),
      ],
    });

    const [state] = await (await makeProvider()).getMessageStates(['m1']);

    expect(state.state).toBe(MailLogState.delivered);
    expect(state.qualitySignals).toEqual([
      expect.objectContaining({ type: EmailQualityEventType.spamComplaint }),
    ]);
  });

  it('skips a message without events and keeps going', async () => {
    mailgunClient.events.get
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [event()] });

    const states = await (await makeProvider()).getMessageStates(['m1', 'm2']);

    expect(states).toHaveLength(1);
    expect(states[0].providerMessageID).toBe('m2');
  });
});

describe('MailgunMailProvider listSuppressions', () => {
  const page = (items: unknown[], next?: string) => ({
    items,
    pages: next ? { next: { page: next } } : {},
  });

  beforeEach(() => {
    mailgunClient.suppressions.list.mockReset();
    mailgunClient.suppressions.list.mockResolvedValue(page([]));
  });

  it('reads bounces, complaints and unsubscribes of the sending domain', async () => {
    mailgunClient.suppressions.list.mockImplementation(
      async (_domain: string, type: string) =>
        page(
          type === 'bounces' ?
            [
              {
                address: 'Dead@Example.com',
                code: '550',
                error: 'user unknown',
                created_at: new Date('2026-10-20T10:15:00Z'),
              },
            ]
          : type === 'complaints' ?
            [
              {
                address: 'angry@example.com',
                created_at: new Date('2026-10-19T08:00:00Z'),
              },
            ]
          : [
              {
                address: 'gone@example.com',
                tags: ['*'],
                created_at: new Date('2026-10-18T08:00:00Z'),
              },
              {
                address: 'picky@example.com',
                tags: ['newsletter'],
                created_at: new Date('2026-10-17T08:00:00Z'),
              },
            ]
        )
    );

    const signals = await (await makeProvider()).listSuppressions();

    expect(mailgunClient.suppressions.list).toHaveBeenCalledWith(
      'mg.wepublish.ch',
      'bounces',
      expect.objectContaining({ limit: 1000 })
    );
    expect(signals).toEqual([
      {
        type: EmailQualityEventType.hardBounce,
        email: 'dead@example.com',
        detail: 'user unknown',
        occurredAt: new Date('2026-10-20T10:15:00Z'),
        providerEventId:
          'mailgun-bounce:dead@example.com:2026-10-20T10:15:00.000Z',
      },
      {
        type: EmailQualityEventType.spamComplaint,
        email: 'angry@example.com',
        detail: null,
        occurredAt: new Date('2026-10-19T08:00:00Z'),
        providerEventId:
          'mailgun-complaint:angry@example.com:2026-10-19T08:00:00.000Z',
      },
      // Mailgun refuses every mail of the domain to this address.
      {
        type: EmailQualityEventType.unsubscribed,
        email: 'gone@example.com',
        detail: null,
        occurredAt: new Date('2026-10-18T08:00:00Z'),
        providerEventId:
          'mailgun-unsubscribe:gone@example.com:2026-10-18T08:00:00.000Z',
      },
      // Only mails with that tag: the person's choice, the inbox is fine.
      {
        type: EmailQualityEventType.optedOut,
        email: 'picky@example.com',
        detail: 'mailgun:newsletter',
        occurredAt: new Date('2026-10-17T08:00:00Z'),
        providerEventId:
          'mailgun-unsubscribe:picky@example.com:2026-10-17T08:00:00.000Z',
      },
    ]);
  });

  it('pages through a long list', async () => {
    mailgunClient.suppressions.list
      .mockResolvedValueOnce(
        page(
          [
            {
              address: 'a@example.com',
              code: '550',
              error: 'x',
              created_at: new Date(0),
            },
          ],
          '?page=next&address=a@example.com'
        )
      )
      .mockResolvedValueOnce(
        page([
          {
            address: 'b@example.com',
            code: '550',
            error: 'x',
            created_at: new Date(0),
          },
        ])
      )
      .mockResolvedValue(page([]));

    const signals = await (await makeProvider()).listSuppressions();

    expect(signals.map(({ email }) => email)).toEqual([
      'a@example.com',
      'b@example.com',
    ]);
    expect(mailgunClient.suppressions.list).toHaveBeenNthCalledWith(
      2,
      'mg.wepublish.ch',
      'bounces',
      expect.objectContaining({ page: '?page=next&address=a@example.com' })
    );
  });
});
