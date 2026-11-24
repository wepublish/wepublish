import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EmailQualityEventSource, EmailQualityEventType } from '@prisma/client';
import {
  audienceWebhookSignals,
  MailchimpAudienceWebhookController,
} from './mailchimp-audience-webhook';

const LIST_ID = 'list-1';

const cleaned = (overrides: Record<string, unknown> = {}) => ({
  type: 'cleaned',
  fired_at: '2026-10-21 09:30:00',
  data: {
    list_id: LIST_ID,
    campaign_id: 'camp-1',
    reason: 'hard',
    email: 'Dead@Example.com',
    ...overrides,
  },
});

const unsubscribe = (overrides: Record<string, unknown> = {}) => ({
  type: 'unsubscribe',
  fired_at: '2026-10-21 09:30:00',
  data: {
    action: 'unsub',
    reason: 'manual',
    id: 'abc',
    list_id: LIST_ID,
    email: 'gone@example.com',
    ...overrides,
  },
});

describe('audienceWebhookSignals', () => {
  it('reads a cleaned address as a hard bounce, dated when Mailchimp fired', () => {
    expect(audienceWebhookSignals(cleaned(), LIST_ID)).toEqual([
      {
        type: EmailQualityEventType.hardBounce,
        email: 'dead@example.com',
        detail: 'mailchimp:list-1: cleaned/hard',
        occurredAt: new Date('2026-10-21T09:30:00Z'),
        providerEventId:
          'mailchimp-audience-webhook:list-1:dead@example.com:cleaned:2026-10-21 09:30:00',
      },
    ]);
  });

  it('reads an abuse cleaning as a complaint', () => {
    expect(
      audienceWebhookSignals(cleaned({ reason: 'abuse' }), LIST_ID)[0]
    ).toMatchObject({ type: EmailQualityEventType.spamComplaint });
  });

  it('reads an unsubscribe as the person opting out', () => {
    expect(audienceWebhookSignals(unsubscribe(), LIST_ID)).toEqual([
      expect.objectContaining({
        type: EmailQualityEventType.optedOut,
        email: 'gone@example.com',
        detail: 'mailchimp:list-1: unsub/manual',
      }),
    ]);
  });

  it('reads an unsubscribe for abuse as a complaint', () => {
    expect(
      audienceWebhookSignals(unsubscribe({ reason: 'abuse' }), LIST_ID)[0]
    ).toMatchObject({ type: EmailQualityEventType.spamComplaint });
  });

  it.each(['subscribe', 'profile', 'upemail', 'campaign'])(
    'says nothing about a %s event',
    type => {
      expect(audienceWebhookSignals({ ...cleaned(), type }, LIST_ID)).toEqual(
        []
      );
    }
  );

  it('says nothing without an address or for another audience', () => {
    expect(
      audienceWebhookSignals(cleaned({ email: undefined }), LIST_ID)
    ).toEqual([]);
    expect(
      audienceWebhookSignals(cleaned({ list_id: 'list-2' }), LIST_ID)
    ).toEqual([]);
  });
});

describe('MailchimpAudienceWebhookController', () => {
  const makeController = ({
    config = {
      id: 'mailchimp-sync',
      mailchimp_listId: LIST_ID,
      decryptedWebhookSecret: 's3cret',
    } as Record<string, unknown> | null,
  } = {}) => {
    const settings = {
      getSyncConfig: vi.fn(async () => {
        if (!config) {
          throw new NotFoundException();
        }

        return config;
      }),
      noteSyncWebhook: vi.fn(async () => undefined),
    };
    const recorder = {
      recordMailSignals: vi.fn(),
      recordAddressSignals: vi.fn(async () => undefined),
      recompute: vi.fn(),
    };
    const controller = new MailchimpAudienceWebhookController(
      settings as never,
      recorder
    );
    const send = vi.fn();
    const res = { status: vi.fn(() => ({ send })) };
    // `key: null` means no key in the URL at all.
    const receive = (
      body: unknown,
      { method = 'POST', key = 's3cret' as string | null } = {}
    ) =>
      controller.receive(
        'mailchimp-sync',
        { method, query: key === null ? {} : { key }, body } as never,
        res as never
      );

    return { settings, recorder, res, receive };
  };

  it('answers the validation call Mailchimp makes before registering', async () => {
    const { receive, res, recorder } = makeController();

    await receive(undefined, { method: 'GET', key: null });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(recorder.recordAddressSignals).not.toHaveBeenCalled();
  });

  it('records what a verified call says and notes the call', async () => {
    const { receive, recorder, settings, res } = makeController();

    await receive(cleaned());

    expect(recorder.recordAddressSignals).toHaveBeenCalledWith({
      email: 'dead@example.com',
      signals: [
        expect.objectContaining({ type: EmailQualityEventType.hardBounce }),
      ],
      source: EmailQualityEventSource.webhook,
    });
    expect(settings.noteSyncWebhook).toHaveBeenCalledWith('mailchimp-sync');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('refuses a call without the key of the URL', async () => {
    const { receive, recorder, settings } = makeController();

    await expect(receive(cleaned(), { key: 'wrong' })).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    await expect(receive(cleaned(), { key: null })).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    expect(recorder.recordAddressSignals).not.toHaveBeenCalled();
    expect(settings.noteSyncWebhook).not.toHaveBeenCalled();
  });

  it('refuses a call for a sync config without a registered webhook', async () => {
    const unknown = makeController({ config: null });
    const unregistered = makeController({
      config: { id: 'mailchimp-sync', mailchimp_listId: LIST_ID },
    });

    await expect(unknown.receive(cleaned())).rejects.toBeInstanceOf(
      NotFoundException
    );
    await expect(unregistered.receive(cleaned())).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('answers 200 to an event it cannot record, so Mailchimp does not give up', async () => {
    const { receive, recorder, res } = makeController();
    recorder.recordAddressSignals.mockRejectedValueOnce(new Error('db down'));

    await expect(receive(cleaned())).resolves.toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('ignores an event of another audience', async () => {
    const { receive, recorder, settings } = makeController();

    await receive(cleaned({ list_id: 'list-2' }));

    expect(recorder.recordAddressSignals).not.toHaveBeenCalled();
    expect(settings.noteSyncWebhook).toHaveBeenCalled();
  });
});
