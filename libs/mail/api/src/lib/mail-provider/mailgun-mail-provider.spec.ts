import crypto from 'crypto';
import { EmailQualityEventType, MailLogState } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { MailgunMailProvider } from './mailgun-mail-provider';

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
    })
  );

  return new MailgunMailProvider({
    id: 'mailgun',
    incomingRequestHandler: jest.fn(),
    kv,
    prisma: {} as any,
  });
};

const request = (eventData: Record<string, unknown>, secret = '') => {
  const timestamp = '1790000000';
  const token = 'token';

  return {
    body: {
      signature: {
        timestamp,
        token,
        signature: crypto
          .createHmac('sha256', secret)
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
  } as any;
};

describe('MailgunMailProvider webhook', () => {
  it('refuses a wrong signature', async () => {
    await expect(
      (await makeProvider()).webhookForSendMail({
        req: request({ event: 'delivered' }, 'not-the-secret'),
      })
    ).rejects.toThrow('Webhook signature failed');
  });

  it.each([
    ['permanent', EmailQualityEventType.hardBounce],
    ['temporary', EmailQualityEventType.softBounce],
  ])('reports a %s failure', async (severity, type) => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail({
      req: request({
        event: 'failed',
        severity,
        'delivery-status': { description: 'mailbox unavailable' },
      }),
    });

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
    ).webhookForSendMail({
      req: request({ event }),
    });

    expect(status.state).toBeNull();
    expect(status.qualitySignals).toEqual([expect.objectContaining({ type })]);
  });

  it('reports nothing about a plain delivery', async () => {
    const [status] = await (
      await makeProvider()
    ).webhookForSendMail({
      req: request({ event: 'delivered' }),
    });

    expect(status.state).toBe(MailLogState.delivered);
    expect(status.qualitySignals).toEqual([]);
  });
});
