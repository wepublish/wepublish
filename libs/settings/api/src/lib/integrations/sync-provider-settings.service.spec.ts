import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingSyncProvider } from '@prisma/client';
import { NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { SyncProviderSettingsDataloaderService } from './sync-provider-settings-dataloader.service';
import { SyncProviderSettingsService } from './sync-provider-settings.service';

const existing = {
  id: 'mailchimp-sync',
  mailchimp_listId: 'list-1',
  name: 'Mailchimp',
  type: 'MAILCHIMP',
  enabled: false,
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  lastLoadedAt: new Date('2026-01-01'),
} as unknown as SettingSyncProvider;

describe('SyncProviderSettingsService', () => {
  let service: SyncProviderSettingsService;
  let prisma: PrismaClient;
  let resets: Pick<NamespaceResets, 'reset'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        SyncProviderSettingsService,
        {
          provide: NamespaceResets,
          useValue: {
            reset: vi.fn(),
          } satisfies Pick<NamespaceResets, 'reset'>,
        },
        {
          provide: SyncProviderSettingsDataloaderService,
          useValue: { prime: vi.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    resets = module.get(NamespaceResets);
    service = module.get<SyncProviderSettingsService>(
      SyncProviderSettingsService
    );
    vi.spyOn(prisma.settingSyncProvider, 'findUnique').mockResolvedValue(
      existing
    );
  });

  afterEach(() => vi.restoreAllMocks());

  test('replaces the newsletters in the given order', async () => {
    const update = vi
      .spyOn(prisma.settingSyncProvider, 'update')
      .mockResolvedValue(existing);

    await service.updateSyncProviderSetting({
      id: 'mailchimp-sync',
      newsletters: [
        { interestId: 'b', name: 'Daily', description: 'Every day' },
        { interestId: 'a', name: 'Weekly', imageID: 'image-1' },
      ],
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'mailchimp-sync' },
      data: {
        newsletters: {
          deleteMany: {},
          create: [
            {
              interestId: 'b',
              name: 'Daily',
              description: 'Every day',
              imageID: undefined,
              sort: 0,
            },
            {
              interestId: 'a',
              name: 'Weekly',
              description: undefined,
              imageID: 'image-1',
              sort: 1,
            },
          ],
        },
      },
    });
  });

  test('keeps the newsletters when none are passed', async () => {
    const update = vi
      .spyOn(prisma.settingSyncProvider, 'update')
      .mockResolvedValue(existing);

    await service.updateSyncProviderSetting({
      id: 'mailchimp-sync',
      name: 'Renamed',
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'mailchimp-sync' },
      data: { name: 'Renamed' },
    });
  });

  test('rejects the same interest twice', async () => {
    await expect(
      service.updateSyncProviderSetting({
        id: 'mailchimp-sync',
        newsletters: [
          { interestId: 'a', name: 'Daily' },
          { interestId: 'a', name: 'Weekly' },
        ],
      })
    ).rejects.toThrow('more than once');
  });

  test('rejects a newsletter without interest or name', async () => {
    await expect(
      service.updateSyncProviderSetting({
        id: 'mailchimp-sync',
        newsletters: [{ interestId: '', name: 'Daily' }],
      })
    ).rejects.toThrow('interest and a name');

    await expect(
      service.updateSyncProviderSetting({
        id: 'mailchimp-sync',
        newsletters: [{ interestId: 'a', name: ' ' }],
      })
    ).rejects.toThrow('interest and a name');
  });

  test('lists the newsletters of a provider by sort order', async () => {
    const findMany = vi
      .spyOn(prisma.settingSyncProviderNewsletter, 'findMany')
      .mockResolvedValue([]);

    await service.newsletters('mailchimp-sync');

    expect(findMany).toHaveBeenCalledWith({
      where: { syncProviderId: 'mailchimp-sync' },
      orderBy: { sort: 'asc' },
    });
  });

  test('sets up the sync provider when none is configured yet', async () => {
    vi.spyOn(prisma.settingSyncProvider, 'count').mockResolvedValue(0);
    const create = vi
      .spyOn(prisma.settingSyncProvider, 'create')
      .mockResolvedValue(existing);

    await service.createSyncProviderSetting({
      id: 'mailchimp-sync',
      type: 'MAILCHIMP',
    } as never);

    expect(create).toHaveBeenCalled();
  });

  test('refuses a second sync provider', async () => {
    vi.spyOn(prisma.settingSyncProvider, 'count').mockResolvedValue(1);
    const create = vi.spyOn(prisma.settingSyncProvider, 'create');

    await expect(
      service.createSyncProviderSetting({
        id: 'another-sync',
        type: 'MAILCHIMP',
      } as never)
    ).rejects.toThrow('already set up');
    expect(create).not.toHaveBeenCalled();
  });

  describe('audience webhook', () => {
    test('stores the webhook secret encrypted and reads it back for the webhook', async () => {
      const update = vi
        .spyOn(prisma.settingSyncProvider, 'update')
        .mockResolvedValue(existing);

      await service.setMailchimpWebhook('mailchimp-sync', {
        secret: 'plain-secret',
        webhookId: 'wh-1',
        registeredAt: new Date('2026-10-21T10:00:00Z'),
      });

      const stored = update.mock.calls[0][0].data as {
        mailchimp_webhookSecret: string;
        mailchimp_webhookId: string;
      };
      expect(stored.mailchimp_webhookSecret).not.toBe('plain-secret');
      expect(stored.mailchimp_webhookId).toBe('wh-1');

      vi.spyOn(prisma.settingSyncProvider, 'findUnique').mockResolvedValue({
        ...existing,
        mailchimp_webhookSecret: stored.mailchimp_webhookSecret,
      });

      await expect(
        service.getSyncConfig('mailchimp-sync')
      ).resolves.toMatchObject({
        decryptedWebhookSecret: 'plain-secret',
        decryptedApiKey: null,
      });
    });

    test('keeps the secret when only the registration is renewed', async () => {
      const update = vi
        .spyOn(prisma.settingSyncProvider, 'update')
        .mockResolvedValue(existing);

      await service.setMailchimpWebhook('mailchimp-sync', {
        webhookId: 'wh-1',
        registeredAt: new Date(),
      });

      expect(update.mock.calls[0][0].data).not.toHaveProperty(
        'mailchimp_webhookSecret'
      );
    });

    test('drops the cached settings once the webhook is registered', async () => {
      vi.spyOn(prisma.settingSyncProvider, 'update').mockResolvedValue(
        existing
      );

      await service.setMailchimpWebhook('mailchimp-sync', {
        webhookId: 'hook-1',
        registeredAt: new Date('2026-10-29'),
      });

      expect(resets.reset).toHaveBeenCalledWith('settings:syncprovider');
    });

    test('notes a delivered webhook call', async () => {
      const update = vi
        .spyOn(prisma.settingSyncProvider, 'update')
        .mockResolvedValue(existing);

      await service.noteSyncWebhook('mailchimp-sync');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'mailchimp-sync' },
        data: { lastWebhookAt: expect.any(Date) },
      });
    });
  });
});
