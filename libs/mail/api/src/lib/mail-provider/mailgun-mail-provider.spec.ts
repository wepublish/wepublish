import { createHmac } from 'crypto';
import { EmailQualityEventType, MailLogState } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { MailProviderError } from './mail-provider.interface';
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
    ).rejects.toThrow('Webhook signature failed');
  });

  it('accepts a webhook signed with the webhook key', async () => {
    const provider = await makeProvider();

    await expect(
      provider.webhookForSendMail(request({ event: 'delivered' }))
    ).resolves.toEqual([
      expect.objectContaining({ mailLogID: 'log-1', state: 'delivered' }),
    ]);
  });

  it.each([
    ['permanent', EmailQualityEventType.hardBounce],
    ['temporary', EmailQualityEventType.softBounce],
  ])('reports a %s failure', async (severity, type) => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail(
      request({
        event: 'failed',
        severity,
        'delivery-status': { description: 'mailbox unavailable' },
      })
    );

    expect(status.state).toBe(MailLogState.bounced);
    expect(status.qualitySignals).toEqual([
      {
        type,
        email: 'jane@example.com',
        detail: 'mailbox unavailable',
        occurredAt: new Date(1790000000 * 1000),
      },
    ]);
  });

  it.each([
    ['complained', EmailQualityEventType.spamComplaint],
    ['unsubscribed', EmailQualityEventType.unsubscribed],
    ['opened', EmailQualityEventType.opened],
    ['clicked', EmailQualityEventType.clicked],
  ])('reports %s without touching the delivery state', async (event, type) => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail(request({ event }));

    expect(status.state).toBeNull();
    expect(status.qualitySignals).toEqual([expect.objectContaining({ type })]);
  });

  it('reports nothing about a plain delivery', async () => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail(request({ event: 'delivered' }));

    expect(status.state).toBe(MailLogState.delivered);
    expect(status.qualitySignals).toEqual([]);
  });
});
