import { createHmac } from 'crypto';
import { EmailQualityEventType, MailLogState } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import {
  MailProviderError,
  MailWebhookSignatureError,
} from './mail-provider.interface';
import { MailgunMailProvider } from './mailgun-mail-provider';

const { answer } = vi.hoisted(() => ({
  answer: {
    error: null as Error | null,
    response: { statusCode: 200, statusMessage: 'OK' },
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
      callback(answer.error, { ...answer.response, resume: () => undefined });
    }
  },
}));

const makeProvider = async () => {
  const kv = createKvMock();

  await kv.setNs(
    'settings:mailprovider',
    'mailgun',
    JSON.stringify({
      id: 'mailgun',
      type: 'mailgun',
      name: 'Mailgun',
      fromAddress: 'dev@wepublish.ch',
      apiKey: 'key',
      mailgun_baseDomain: 'api.eu.mailgun.net',
      mailgun_mailDomain: 'mg.wepublish.ch',
      webhookEndpointSecret: 'webhook-key',
    })
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

  it('sends a mail Mailgun accepted', async () => {
    const provider = await makeProvider();

    await expect(provider.sendMail(sendProps)).resolves.toEqual({});
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
