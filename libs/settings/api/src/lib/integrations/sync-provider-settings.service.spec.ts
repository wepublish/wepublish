import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingSyncProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { SyncProviderSettingsDataloaderService } from './sync-provider-settings-dataloader.service';
import { SyncProviderSettingsService } from './sync-provider-settings.service';

const existing = {
  id: 'mailchimp-sync',
  type: 'MAILCHIMP',
  name: 'Mailchimp',
  enabled: true,
  mailchimp_listId: 'list-1',
} as SettingSyncProvider;

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
});
