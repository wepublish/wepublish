import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingSyncProvider } from '@prisma/client';
import { NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { SyncProviderSettingsDataloaderService } from './sync-provider-settings-dataloader.service';
import { SecretCrypto } from './secrets-crypto';
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

  test('hands out the key of a sync provider that is not enabled yet', async () => {
    vi.spyOn(prisma.settingSyncProvider, 'findUnique').mockResolvedValue({
      ...existing,
      mailchimp_apiKey: new SecretCrypto().encrypt('abc123-us1'),
    } as SettingSyncProvider);

    await expect(
      service.getSyncConfig('mailchimp-sync')
    ).resolves.toMatchObject({
      id: 'mailchimp-sync',
      enabled: false,
      decryptedApiKey: 'abc123-us1',
    });
  });

  test('reports a sync provider that does not exist', async () => {
    vi.spyOn(prisma.settingSyncProvider, 'findUnique').mockResolvedValue(null);

    await expect(service.getSyncConfig('unknown')).rejects.toThrow('not found');
  });
});
