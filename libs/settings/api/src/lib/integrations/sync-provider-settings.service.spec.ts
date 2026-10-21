import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingSyncProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { SyncProviderSettingsDataloaderService } from './sync-provider-settings-dataloader.service';
import { SyncProviderSettingsService } from './sync-provider-settings.service';

const existing = {
  id: 'mailchimp-sync',
  name: 'Mailchimp',
  type: 'mailchimp',
  enabled: false,
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  lastLoadedAt: new Date('2026-01-01'),
} as unknown as SettingSyncProvider;

describe('SyncProviderSettingsService', () => {
  let service: SyncProviderSettingsService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        SyncProviderSettingsService,
        { provide: KvTtlCacheService, useValue: { resetNamespace: vi.fn() } },
        {
          provide: SyncProviderSettingsDataloaderService,
          useValue: { prime: vi.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<SyncProviderSettingsService>(
      SyncProviderSettingsService
    );
  });

  afterEach(() => vi.restoreAllMocks());

  test('sets up the sync provider when none is configured yet', async () => {
    vi.spyOn(prisma.settingSyncProvider, 'count').mockResolvedValue(0);
    const create = vi
      .spyOn(prisma.settingSyncProvider, 'create')
      .mockResolvedValue(existing);

    await service.createSyncProviderSetting({
      id: 'mailchimp-sync',
      type: 'mailchimp',
    } as never);

    expect(create).toHaveBeenCalled();
  });

  test('refuses a second sync provider', async () => {
    vi.spyOn(prisma.settingSyncProvider, 'count').mockResolvedValue(1);
    const create = vi.spyOn(prisma.settingSyncProvider, 'create');

    await expect(
      service.createSyncProviderSetting({
        id: 'another-sync',
        type: 'mailchimp',
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

      await expect(service.getSyncConfig('mailchimp-sync')).resolves.toMatchObject(
        { decryptedWebhookSecret: 'plain-secret', decryptedApiKey: null }
      );
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
