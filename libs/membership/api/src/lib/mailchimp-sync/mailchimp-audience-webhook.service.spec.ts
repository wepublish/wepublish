import { BadRequestException } from '@nestjs/common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import type { Mock } from 'vitest';
import { MailchimpAudienceWebhookService } from './mailchimp-audience-webhook.service';

vi.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    setConfig: vi.fn(),
    lists: {
      getListWebhooks: vi.fn(),
      createListWebhook: vi.fn(),
      updateListWebhook: vi.fn(),
    },
  },
}));

const lists = (mailchimp as unknown as { lists: Record<string, Mock> }).lists;

const CONFIG_ID = 'mailchimp-sync';
const LIST_ID = 'list-1';
const HOST = 'https://api.example.ch';

const makeService = ({
  config = {} as Record<string, unknown>,
  hostUrl = HOST as string | null,
} = {}) => {
  const settings = {
    getSyncConfig: vi.fn(async () => ({
      id: CONFIG_ID,
      mailchimp_listId: LIST_ID,
      decryptedApiKey: 'key-us1',
      decryptedWebhookSecret: null,
      mailchimp_webhookId: null,
      ...config,
    })),
    setMailchimpWebhook: vi.fn(async () => undefined),
  };

  if (hostUrl === null) {
    delete process.env['HOST_URL'];
  } else {
    process.env['HOST_URL'] = hostUrl;
  }

  return {
    settings,
    service: new MailchimpAudienceWebhookService(settings as never),
  };
};

describe('MailchimpAudienceWebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lists.getListWebhooks.mockResolvedValue({ webhooks: [] });
    lists.createListWebhook.mockResolvedValue({ id: 'wh-1' });
    lists.updateListWebhook.mockResolvedValue({ id: 'wh-1' });
  });

  it('registers a webhook for the audience events that matter, with a fresh secret in the URL', async () => {
    const { service, settings } = makeService();

    const result = await service.register(CONFIG_ID);

    const [listId, body] = lists.createListWebhook.mock.calls[0];
    expect(listId).toBe(LIST_ID);
    expect(body.url).toMatch(
      new RegExp(
        `^${HOST}/audience-webhooks/mailchimp/${CONFIG_ID}\\?key=[A-Za-z0-9_-]{20,}$`
      )
    );
    expect(body.events).toEqual({
      subscribe: false,
      unsubscribe: true,
      profile: false,
      cleaned: true,
      upemail: true,
      campaign: false,
    });
    expect(body.sources).toEqual({ user: true, admin: true, api: true });
    expect(settings.setMailchimpWebhook).toHaveBeenCalledWith(CONFIG_ID, {
      secret: expect.stringMatching(/^[A-Za-z0-9_-]{20,}$/),
      webhookId: 'wh-1',
      registeredAt: expect.any(Date),
    });
    expect(result).toEqual({
      url: body.url,
      webhookId: 'wh-1',
      registeredAt: expect.any(Date),
    });
  });

  it('keeps the secret once there is one and updates the webhook it registered before', async () => {
    const { service, settings } = makeService({
      config: {
        decryptedWebhookSecret: 'old-secret',
        mailchimp_webhookId: 'wh-1',
      },
    });

    const result = await service.register(CONFIG_ID);

    expect(lists.updateListWebhook).toHaveBeenCalledWith(
      LIST_ID,
      'wh-1',
      expect.objectContaining({
        url: expect.stringContaining('?key=old-secret'),
      })
    );
    expect(lists.createListWebhook).not.toHaveBeenCalled();
    expect(settings.setMailchimpWebhook).toHaveBeenCalledWith(CONFIG_ID, {
      secret: undefined,
      webhookId: 'wh-1',
      registeredAt: expect.any(Date),
    });
    expect(result.url).toContain('?key=old-secret');
  });

  it('registers afresh when Mailchimp no longer knows the webhook', async () => {
    const { service } = makeService({
      config: {
        decryptedWebhookSecret: 'old-secret',
        mailchimp_webhookId: 'wh-gone',
      },
    });
    lists.updateListWebhook.mockRejectedValueOnce({ status: 404 });
    lists.createListWebhook.mockResolvedValue({ id: 'wh-2' });

    const result = await service.register(CONFIG_ID);

    expect(result.webhookId).toBe('wh-2');
  });

  it('adopts a webhook Mailchimp already has for this installation instead of adding a second', async () => {
    const { service } = makeService();
    lists.getListWebhooks.mockResolvedValue({
      webhooks: [
        { id: 'other', url: 'https://elsewhere.example/hook' },
        {
          id: 'wh-mine',
          url: `${HOST}/audience-webhooks/mailchimp/${CONFIG_ID}?key=lost`,
        },
      ],
    });

    const result = await service.register(CONFIG_ID);

    expect(lists.updateListWebhook).toHaveBeenCalledWith(
      LIST_ID,
      'wh-mine',
      expect.anything()
    );
    expect(lists.createListWebhook).not.toHaveBeenCalled();
    expect(result.webhookId).toBe('wh-mine');
  });

  it('needs an audience and the public address of the api', async () => {
    await expect(
      makeService({ config: { mailchimp_listId: null } }).service.register(
        CONFIG_ID
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      makeService({ hostUrl: null }).service.register(CONFIG_ID)
    ).rejects.toThrow('HOST_URL');
  });

  it('says what Mailchimp answered when it refuses the registration', async () => {
    const { service } = makeService();
    lists.createListWebhook.mockRejectedValue({
      status: 400,
      response: {
        body: {
          status: 400,
          title: 'Invalid Resource',
          detail: 'url unreachable',
        },
      },
    });

    await expect(service.register(CONFIG_ID)).rejects.toThrow(
      'url unreachable'
    );
  });
});
