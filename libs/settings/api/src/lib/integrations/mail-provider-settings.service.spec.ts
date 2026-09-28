import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingMailProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ProviderSettingsChanged } from './provider-settings-changed';
import { MailProviderSettingsDataloaderService } from './mail-provider-settings-dataloader.service';
import { MailProviderSettingsService } from './mail-provider-settings.service';

const existing = {
  id: 'mail',
  name: 'Mailgun',
  type: 'MAILGUN',
  apiKey: 'secret',
  mailgun_mailDomain: 'mg.example.com',
  mailgun_baseDomain: 'api.eu.mailgun.net',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  lastLoadedAt: new Date('2026-01-01'),
} as SettingMailProvider;

describe('MailProviderSettingsService', () => {
  let service: MailProviderSettingsService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        MailProviderSettingsService,
        { provide: KvTtlCacheService, useValue: { resetNamespace: jest.fn() } },
        { provide: ProviderSettingsChanged, useValue: { notify: jest.fn() } },
        {
          provide: MailProviderSettingsDataloaderService,
          useValue: { prime: jest.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<MailProviderSettingsService>(
      MailProviderSettingsService
    );
  });

  afterEach(() => jest.restoreAllMocks());

  test('switching type clears the configuration of the old one', async () => {
    jest
      .spyOn(prisma.settingMailProvider, 'findUnique')
      .mockResolvedValue(existing);
    const update = jest
      .spyOn(prisma.settingMailProvider, 'update')
      .mockResolvedValue(existing);

    await service.updateMailProviderSetting({
      id: 'mail',
      type: 'SMTP',
      name: 'Local SMTP',
      apiKey: 'secret',
      mailgun_mailDomain: 'mg.example.com',
      mailgun_baseDomain: 'api.eu.mailgun.net',
    } as never);

    const data = update.mock.calls[0][0].data as Record<string, unknown>;

    expect(data['type']).toBe('SMTP');
    expect(data['name']).toBe('Local SMTP');
    expect(data['apiKey']).toBeNull();
    expect(data['mailgun_mailDomain']).toBeNull();
    expect(data['mailgun_baseDomain']).toBeNull();
    expect(data['smtp_host']).toBeNull();
  });

  test('leaves the configuration alone when the type stays the same', async () => {
    jest
      .spyOn(prisma.settingMailProvider, 'findUnique')
      .mockResolvedValue(existing);
    const update = jest
      .spyOn(prisma.settingMailProvider, 'update')
      .mockResolvedValue(existing);

    await service.updateMailProviderSetting({
      id: 'mail',
      type: 'MAILGUN',
      name: 'Renamed',
    } as never);

    expect(update.mock.calls[0][0].data).toEqual({
      type: 'MAILGUN',
      name: 'Renamed',
    });
  });

  test('refuses to delete the only mail provider', async () => {
    jest
      .spyOn(prisma.settingMailProvider, 'findUnique')
      .mockResolvedValue(existing);
    jest.spyOn(prisma.settingMailProvider, 'count').mockResolvedValue(1);

    await expect(service.deleteMailProviderSetting('mail')).rejects.toThrow(
      'is the only one configured'
    );
  });
});
