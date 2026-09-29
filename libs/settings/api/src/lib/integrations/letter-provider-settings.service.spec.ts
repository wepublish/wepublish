import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingLetterProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ProviderSettingsChanged } from './provider-settings-changed';
import { LetterProviderSettingsDataloaderService } from './letter-provider-settings-dataloader.service';
import { LetterProviderSettingsService } from './letter-provider-settings.service';

const existing = {
  id: 'pingen',
  name: 'Pingen',
  type: 'pingen',
  environment: 'production',
  clientId: 'client',
  clientSecret: 'secret',
  organisationId: 'org',
  webhookSigningKey: 'signing',
  autoSend: true,
  placeholderEmailContains: '@placeholder.example.com',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  lastLoadedAt: new Date('2026-01-01'),
} as SettingLetterProvider;

describe('LetterProviderSettingsService', () => {
  let service: LetterProviderSettingsService;
  let prisma: PrismaClient;
  let notify: jest.Mock;

  beforeEach(async () => {
    notify = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        LetterProviderSettingsService,
        { provide: KvTtlCacheService, useValue: { resetNamespace: jest.fn() } },
        { provide: ProviderSettingsChanged, useValue: { notify } },
        {
          provide: LetterProviderSettingsDataloaderService,
          useValue: { prime: jest.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<LetterProviderSettingsService>(
      LetterProviderSettingsService
    );
  });

  afterEach(() => jest.restoreAllMocks());

  test('switching type clears the configuration and resets the defaults', async () => {
    jest
      .spyOn(prisma.settingLetterProvider, 'findUnique')
      .mockResolvedValue(existing);
    const update = jest
      .spyOn(prisma.settingLetterProvider, 'update')
      .mockResolvedValue(existing);

    await service.updateLetterProviderSetting({
      id: 'pingen',
      type: 'other',
      name: 'Other',
    } as never);

    const data = update.mock.calls[0][0].data as Record<string, unknown>;

    expect(data['type']).toBe('other');
    expect(data['name']).toBe('Other');
    expect(data['clientId']).toBeNull();
    expect(data['clientSecret']).toBeNull();
    expect(data['webhookSigningKey']).toBeNull();
    expect(data['environment']).toBe('staging');
    expect(data['autoSend']).toBe(false);
  });

  test('leaves the configuration alone when the type stays the same', async () => {
    jest
      .spyOn(prisma.settingLetterProvider, 'findUnique')
      .mockResolvedValue(existing);
    const update = jest
      .spyOn(prisma.settingLetterProvider, 'update')
      .mockResolvedValue(existing);

    await service.updateLetterProviderSetting({
      id: 'pingen',
      type: 'pingen',
      name: 'Renamed',
    } as never);

    expect(update.mock.calls[0][0].data).toEqual({
      type: 'pingen',
      name: 'Renamed',
    });
    expect(notify).toHaveBeenCalledWith('Letter provider');
  });

  test('refuses to delete the only letter provider', async () => {
    jest
      .spyOn(prisma.settingLetterProvider, 'findUnique')
      .mockResolvedValue(existing);
    jest.spyOn(prisma.settingLetterProvider, 'count').mockResolvedValue(1);

    await expect(service.deleteLetterProviderSetting('pingen')).rejects.toThrow(
      'is the only one configured'
    );
  });
});
