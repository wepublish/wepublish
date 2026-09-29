import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingPdfRenderer } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ProviderSettingsChanged } from './provider-settings-changed';
import { PdfRendererSettingsDataloaderService } from './pdf-renderer-settings-dataloader.service';
import { PdfRendererSettingsService } from './pdf-renderer-settings.service';
import { SecretCrypto } from './secrets-crypto';

const cloudflare = {
  id: 'pdf',
  name: 'PDF',
  type: 'cloudflare',
  cloudflare_accountId: 'account',
  cloudflare_apiToken: 'token',
  gotenberg_url: null,
  gotenberg_username: null,
  gotenberg_password: null,
  timeoutMs: 30000,
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  lastLoadedAt: new Date('2026-01-01'),
} as SettingPdfRenderer;

describe('PdfRendererSettingsService', () => {
  let service: PdfRendererSettingsService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        PdfRendererSettingsService,
        { provide: KvTtlCacheService, useValue: { resetNamespace: jest.fn() } },
        { provide: ProviderSettingsChanged, useValue: { notify: jest.fn() } },
        {
          provide: PdfRendererSettingsDataloaderService,
          useValue: { prime: jest.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<PdfRendererSettingsService>(
      PdfRendererSettingsService
    );
  });

  afterEach(() => jest.restoreAllMocks());

  test('stores the gotenberg password encrypted', async () => {
    const create = jest
      .spyOn(prisma.settingPdfRenderer, 'create')
      .mockResolvedValue(cloudflare);

    await service.createPdfRendererSetting({
      id: 'gotenberg',
      type: 'gotenberg',
      gotenberg_url: 'http://gotenberg:3000',
      gotenberg_username: 'user',
      gotenberg_password: 'plain',
    } as never);

    const data = create.mock.calls[0][0].data as unknown as Record<
      string,
      string
    >;

    expect(data['gotenberg_username']).toBe('user');
    expect(data['gotenberg_password']).not.toBe('plain');
    expect(new SecretCrypto().decrypt(data['gotenberg_password'])).toBe(
      'plain'
    );
  });

  test('switching from cloudflare to gotenberg clears the cloudflare credentials', async () => {
    jest
      .spyOn(prisma.settingPdfRenderer, 'findUnique')
      .mockResolvedValue(cloudflare);
    const update = jest
      .spyOn(prisma.settingPdfRenderer, 'update')
      .mockResolvedValue(cloudflare);

    await service.updatePdfRendererSetting({
      id: 'pdf',
      type: 'gotenberg',
    } as never);

    const data = update.mock.calls[0][0].data as Record<string, unknown>;

    expect(data['type']).toBe('gotenberg');
    expect(data['cloudflare_accountId']).toBeNull();
    expect(data['cloudflare_apiToken']).toBeNull();
    expect(data['timeoutMs']).toBeNull();
    expect(data).not.toHaveProperty('name');
  });
});
