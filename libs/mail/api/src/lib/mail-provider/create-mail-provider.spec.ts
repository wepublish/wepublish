import { MailProviderType } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { Readable } from 'node:stream';
import { createMailProvider, loadMailProvider } from './create-mail-provider';
import { SmtpMailProvider } from './smtp-mail-provider';

describe('loadMailProvider', () => {
  let testing: NamespacedCacheTesting;

  beforeEach(async () => {
    testing = await createNamespacedCacheTesting();
  });

  afterEach(() => testing.close());

  it('only considers providers that were not retired', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'smtp', type: MailProviderType.SMTP });

    const provider = await loadMailProvider({
      prisma: { settingMailProvider: { findFirst } } as never,
      kv: testing.cache,
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } })
    );
    expect(provider).toBeInstanceOf(SmtpMailProvider);
    expect(provider?.id).toBe('smtp');
  });

  it('reports no provider when every one was retired', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);

    const provider = await loadMailProvider({
      prisma: { settingMailProvider: { findFirst } } as never,
      kv: testing.cache,
    });

    expect(provider).toBeNull();
  });
});

const runIncomingRequestHandler = (
  type: MailProviderType,
  contentType: string,
  body: string
) =>
  new Promise<{ error: unknown; body: unknown }>(resolve => {
    const provider = createMailProvider('provider', type, {
      prisma: {} as never,
      kv: {} as never,
    });
    const req = Object.assign(Readable.from([Buffer.from(body)]), {
      headers: {
        'content-type': contentType,
        'content-length': String(Buffer.byteLength(body)),
      },
    }) as never as { body: unknown };

    provider.incomingRequestHandler(req as never, {} as never, error =>
      resolve({ error, body: req.body })
    );
  });

const mandrillBatch = (count: number) =>
  JSON.stringify(
    Array.from({ length: count }, (_, index) => ({
      event: 'send',
      _id: `message-${index}`,
      msg: {
        email: `reader-${index}@example.com`,
        subject: 'Newsletter',
        metadata: { mail_log_id: `mail-log-${index}` },
        tags: ['newsletter'],
        smtp_events: [],
        padding: 'x'.repeat(2000),
      },
    }))
  );

describe('createMailProvider incoming request handler', () => {
  it('parses a full Mandrill batch of 1000 events', async () => {
    const events = mandrillBatch(1000);
    const body = new URLSearchParams({ mandrill_events: events }).toString();

    const result = await runIncomingRequestHandler(
      MailProviderType.MAILCHIMP,
      'application/x-www-form-urlencoded',
      body
    );

    expect(result.error).toBeUndefined();
    expect(result.body).toEqual({ mandrill_events: events });
  });

  it.each([MailProviderType.MAILGUN, MailProviderType.BREVO])(
    'parses a JSON webhook body larger than 100kb for %s',
    async type => {
      const events = JSON.parse(mandrillBatch(100));

      const result = await runIncomingRequestHandler(
        type,
        'application/json',
        JSON.stringify(events)
      );

      expect(result.error).toBeUndefined();
      expect(result.body).toEqual(events);
    }
  );
});
