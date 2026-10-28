import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { createHash } from 'crypto';
import { MailchimpNewsletterService } from './mailchimp-newsletter.service';

vi.mock('@mailchimp/mailchimp_marketing', () => ({
  __esModule: true,
  default: {
    setConfig: vi.fn(),
    lists: {
      getListMember: vi.fn(),
      setListMember: vi.fn(),
    },
  },
}));

const notFound = () =>
  Object.assign(new Error('Not Found'), {
    status: 404,
    response: { body: { status: 404, title: 'Resource Not Found' } },
  });

describe('MailchimpNewsletterService', () => {
  let service: MailchimpNewsletterService;

  const getListMember = mailchimp.lists.getListMember as Mock;
  const setListMember = mailchimp.lists.setListMember as Mock;
  const setConfig = mailchimp.setConfig as Mock;

  const email = 'Reader@Example.com ';
  const subscriberHash = createHash('md5')
    .update('reader@example.com')
    .digest('hex');

  const provider = {
    id: 'mailchimp-sync',
    type: 'MAILCHIMP',
    enabled: true,
    mailchimp_listId: 'list-1',
    decryptedApiKey: 'secret-us21',
  };

  const newsletters = [
    {
      id: 'n1',
      interestId: 'daily',
      name: 'Daily',
      description: 'Every morning',
      imageID: 'image-1',
      sort: 0,
    },
    {
      id: 'n2',
      interestId: 'weekly',
      name: 'Weekly',
      description: null,
      imageID: null,
      sort: 1,
    },
  ];

  const settings = {
    getEnabledSyncConfigs: vi.fn(),
    newsletters: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    settings.getEnabledSyncConfigs.mockResolvedValue([provider]);
    settings.newsletters.mockResolvedValue(newsletters);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailchimpNewsletterService,
        { provide: SyncProviderSettingsService, useValue: settings },
      ],
    }).compile();

    service = module.get(MailchimpNewsletterService);
  });

  describe('getUserNewsletters', () => {
    test('marks every newsletter as not subscribed for a non member', async () => {
      getListMember.mockRejectedValue(notFound());

      const result = await service.getUserNewsletters(email);

      expect(setConfig).toHaveBeenCalledWith({
        apiKey: 'secret-us21',
        server: 'us21',
      });
      expect(getListMember).toHaveBeenCalledWith('list-1', subscriberHash);
      expect(result).toEqual([
        {
          syncProviderId: 'mailchimp-sync',
          newsletters: [
            {
              interestId: 'daily',
              name: 'Daily',
              description: 'Every morning',
              imageID: 'image-1',
              subscribed: false,
            },
            {
              interestId: 'weekly',
              name: 'Weekly',
              description: null,
              imageID: undefined,
              subscribed: false,
            },
          ],
        },
      ]);
    });

    test('reflects the interests of a subscribed member', async () => {
      getListMember.mockResolvedValue({
        status: 'subscribed',
        interests: { daily: false, weekly: true, other: true },
      });

      const [group] = await service.getUserNewsletters(email);

      expect(
        group.newsletters.map(({ interestId, subscribed }) => ({
          interestId,
          subscribed,
        }))
      ).toEqual([
        { interestId: 'daily', subscribed: false },
        { interestId: 'weekly', subscribed: true },
      ]);
    });

    test('treats an unsubscribed member as not subscribed', async () => {
      getListMember.mockResolvedValue({
        status: 'unsubscribed',
        interests: { daily: true, weekly: true },
      });

      const [group] = await service.getUserNewsletters(email);

      expect(group.newsletters.every(n => !n.subscribed)).toBe(true);
    });

    test('skips providers without list or newsletters', async () => {
      settings.getEnabledSyncConfigs.mockResolvedValue([
        { ...provider, id: 'no-list', mailchimp_listId: null },
        provider,
      ]);
      settings.newsletters.mockResolvedValue([]);

      const result = await service.getUserNewsletters(email);

      expect(result).toEqual([]);
      expect(getListMember).not.toHaveBeenCalled();
    });

    test('surfaces other Mailchimp errors', async () => {
      getListMember.mockRejectedValue(
        Object.assign(new Error('boom'), {
          response: { body: { status: 500, title: 'Server', detail: 'down' } },
        })
      );

      await expect(service.getUserNewsletters(email)).rejects.toThrow(
        'Server (500): down'
      );
    });
  });

  describe('updateUserNewsletters', () => {
    test('only sends the given configured interests and keeps the status', async () => {
      getListMember.mockResolvedValue({
        status: 'subscribed',
        interests: { daily: true, weekly: false, other: true },
      });
      setListMember.mockResolvedValue({
        status: 'subscribed',
        interests: { daily: false, weekly: true, other: true },
      });

      const result = await service.updateUserNewsletters(email, {
        syncProviderId: 'mailchimp-sync',
        newsletters: [
          { interestId: 'daily', subscribed: false },
          { interestId: 'weekly', subscribed: true },
        ],
      });

      expect(setListMember).toHaveBeenCalledWith('list-1', subscriberHash, {
        email_address: 'Reader@Example.com',
        status_if_new: 'pending',
        interests: { daily: false, weekly: true },
      });
      expect(
        result.newsletters.map(({ interestId, subscribed }) => ({
          interestId,
          subscribed,
        }))
      ).toEqual([
        { interestId: 'daily', subscribed: false },
        { interestId: 'weekly', subscribed: true },
      ]);
    });

    test('adds a new member as pending', async () => {
      getListMember.mockRejectedValue(notFound());
      setListMember.mockResolvedValue({
        status: 'pending',
        interests: { daily: true },
      });

      await service.updateUserNewsletters(email, {
        syncProviderId: 'mailchimp-sync',
        newsletters: [{ interestId: 'daily', subscribed: true }],
      });

      expect(setListMember).toHaveBeenCalledWith(
        'list-1',
        subscriberHash,
        expect.objectContaining({ status_if_new: 'pending' })
      );
      expect(setListMember.mock.calls[0][2]).not.toHaveProperty('status');
    });

    test('does not add a non member who subscribes to nothing', async () => {
      getListMember.mockRejectedValue(notFound());

      const result = await service.updateUserNewsletters(email, {
        syncProviderId: 'mailchimp-sync',
        newsletters: [{ interestId: 'daily', subscribed: false }],
      });

      expect(setListMember).not.toHaveBeenCalled();
      expect(result.newsletters.every(n => !n.subscribed)).toBe(true);
    });

    test('resubscribes an unsubscribed member as pending', async () => {
      getListMember.mockResolvedValue({
        status: 'unsubscribed',
        interests: {},
      });
      setListMember.mockResolvedValue({
        status: 'pending',
        interests: { daily: true },
      });

      await service.updateUserNewsletters(email, {
        syncProviderId: 'mailchimp-sync',
        newsletters: [{ interestId: 'daily', subscribed: true }],
      });

      expect(setListMember).toHaveBeenCalledWith(
        'list-1',
        subscriberHash,
        expect.objectContaining({ status: 'pending' })
      );
    });

    test('rejects interests that are not configured', async () => {
      await expect(
        service.updateUserNewsletters(email, {
          syncProviderId: 'mailchimp-sync',
          newsletters: [{ interestId: 'other', subscribed: true }],
        })
      ).rejects.toThrow('other');

      expect(setListMember).not.toHaveBeenCalled();
    });

    test('rejects an unknown or disabled provider', async () => {
      await expect(
        service.updateUserNewsletters(email, {
          syncProviderId: 'unknown',
          newsletters: [],
        })
      ).rejects.toThrow('unknown');
    });
  });
});
