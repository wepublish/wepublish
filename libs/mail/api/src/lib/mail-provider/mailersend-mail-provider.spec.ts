import crypto from 'crypto';

import { MailLogState, PrismaClient } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { Request } from 'express';
import nock from 'nock';

import { MailersendMailProvider } from './mailersend-mail-provider';

const providerConfig = {
  id: 'mailersend',
  type: 'mailersend',
  name: 'MailerSend',
  fromAddress: 'newsroom@example.test',
  replyToAddress: 'reply@example.test',
  webhookEndpointSecret: 'webhook-secret',
  apiKey: 'api-token',
};

type MailerSendWebhookRequest = Request & {
  rawBody: string;
};

function testWebhookRequest(
  req: Pick<MailerSendWebhookRequest, 'method' | 'headers' | 'rawBody' | 'body'>
): MailerSendWebhookRequest {
  return req as unknown as MailerSendWebhookRequest;
}

async function createProvider() {
  const kv = createKvMock();
  await kv.setNs('settings:mailprovider', 'mailersend', providerConfig);

  return new MailersendMailProvider({
    id: 'mailersend',
    kv,
    prisma: {} as PrismaClient,
  });
}

describe('MailersendMailProvider', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('sends a template email with personalization and the mail log tag', async () => {
    const provider = await createProvider();

    const scope = nock('https://api.mailersend.com', {
      reqheaders: {
        authorization: 'Bearer api-token',
      },
    })
      .post('/v1/email', body => {
        expect(body).toMatchObject({
          from: { email: 'newsroom@example.test' },
          to: [{ email: 'subscriber@example.test' }],
          reply_to: { email: 'reply@example.test' },
          subject: 'Subscription renewal',
          template_id: 'template-id',
          tags: ['mail_log:mail-log-id'],
          personalization: [
            {
              email: 'subscriber@example.test',
              data: {
                user: { firstName: 'Ada' },
              },
            },
          ],
        });

        return true;
      })
      .reply(202);

    await provider.sendMail({
      mailLogID: 'mail-log-id',
      recipient: 'subscriber@example.test',
      replyToAddress: 'reply@example.test',
      subject: 'Subscription renewal',
      template: 'template-id',
      templateData: {
        user: {
          firstName: 'Ada',
        },
      },
    });

    expect(scope.isDone()).toBe(true);
  });

  it('maps remote templates from the MailerSend API', async () => {
    const provider = await createProvider();

    nock('https://api.mailersend.com')
      .get('/v1/templates')
      .query({ limit: '100' })
      .reply(200, {
        data: [
          {
            id: 'template-1',
            name: 'Welcome',
            created_at: '2026-01-02T03:04:05.000000Z',
            updated_at: '2026-01-03T04:05:06.000000Z',
          },
        ],
      });

    await expect(provider.getTemplates()).resolves.toEqual([
      {
        name: 'Welcome',
        uniqueIdentifier: 'template-1',
        createdAt: new Date('2026-01-02T03:04:05.000000Z'),
        updatedAt: new Date('2026-01-03T04:05:06.000000Z'),
      },
    ]);
  });

  it('verifies webhook signatures against the raw body and extracts mail log tags', async () => {
    const provider = await createProvider();
    const rawBody = JSON.stringify({
      type: 'activity.delivered',
      data: {
        tags: ['newsletter', 'mail_log:mail-log-id'],
      },
    });
    const signature = crypto
      .createHmac('sha256', providerConfig.webhookEndpointSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    await expect(
      provider.webhookForSendMail({
        req: testWebhookRequest({
          method: 'POST',
          headers: { signature },
          rawBody,
          body: JSON.parse(rawBody),
        }),
      })
    ).resolves.toEqual([
      {
        state: MailLogState.delivered,
        mailLogID: 'mail-log-id',
        mailData: rawBody,
      },
    ]);
  });

  it('rejects webhooks without a valid MailerSend signature', async () => {
    const provider = await createProvider();

    await expect(
      provider.webhookForSendMail({
        req: testWebhookRequest({
          method: 'POST',
          headers: { signature: 'bad-signature' },
          rawBody: '{"type":"activity.sent"}',
          body: { type: 'activity.sent' },
        }),
      })
    ).rejects.toThrow('Webhook signature failed');
  });
});
