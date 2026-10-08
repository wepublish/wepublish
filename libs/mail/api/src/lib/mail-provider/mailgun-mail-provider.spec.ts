import { createHmac } from 'crypto';
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
  const webhook = (signature: string) => ({
    req: {
      body: {
        signature: { timestamp: '1700000000', token: 'token-1', signature },
        'event-data': {
          event: 'delivered',
          'user-variables': { mail_log_id: 'log-1' },
        },
      },
    },
  });

  const signedWith = (key: string) =>
    createHmac('sha256', key).update('1700000000token-1').digest('hex');

  it('refuses a webhook that was not signed with the webhook key', async () => {
    const provider = await makeProvider();

    await expect(
      provider.webhookForSendMail(webhook(signedWith('forged')) as never)
    ).rejects.toThrow('Webhook signature failed');
  });

  it('accepts a webhook signed with the webhook key', async () => {
    const provider = await makeProvider();

    await expect(
      provider.webhookForSendMail(webhook(signedWith('webhook-key')) as never)
    ).resolves.toEqual([
      expect.objectContaining({ mailLogID: 'log-1', state: 'delivered' }),
    ]);
  });
});
