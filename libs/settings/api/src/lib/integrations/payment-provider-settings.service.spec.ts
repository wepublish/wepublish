import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingPaymentProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ProviderSettingsChanged } from './provider-settings-changed';
import * as Sentry from '@sentry/nestjs';

jest.mock('@sentry/nestjs', () => ({ captureMessage: jest.fn() }));
import { PaymentProviderSettingsDataloaderService } from './payment-provider-settings-dataloader.service';
import { PaymentProviderSettingsService } from './payment-provider-settings.service';

const provider = (
  overrides: Partial<SettingPaymentProvider> = {}
): SettingPaymentProvider =>
  ({
    id: 'payrexx',
    name: 'payrexx',
    type: 'PAYREXX',
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    modifiedAt: new Date('2026-01-01'),
    lastLoadedAt: new Date('2026-01-01'),
  }) as SettingPaymentProvider;

describe('PaymentProviderSettingsService', () => {
  let service: PaymentProviderSettingsService;
  let prisma: PrismaClient;
  let providerSettingsChanged: { notify: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        PaymentProviderSettingsService,
        {
          provide: KvTtlCacheService,
          useValue: { resetNamespace: jest.fn() },
        },
        {
          provide: ProviderSettingsChanged,
          useValue: { notify: jest.fn() },
        },
        {
          provide: PaymentProviderSettingsDataloaderService,
          useValue: { prime: jest.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<PaymentProviderSettingsService>(
      PaymentProviderSettingsService
    );
    providerSettingsChanged = module.get(ProviderSettingsChanged);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.mocked(Sentry.captureMessage).mockClear();
  });

  test('hides deleted providers from the list', async () => {
    const findMany = jest
      .spyOn(prisma.settingPaymentProvider, 'findMany')
      .mockResolvedValue([]);

    await service.paymentProviderSettingsList();

    expect(findMany.mock.calls[0][0]?.where).toEqual({ deletedAt: null });
  });

  test('deleting only marks the row, so the provider keeps running', async () => {
    jest
      .spyOn(prisma.settingPaymentProvider, 'findUnique')
      .mockResolvedValue(provider());
    jest.spyOn(prisma.paymentMethod, 'findMany').mockResolvedValue([]);
    const update = jest
      .spyOn(prisma.settingPaymentProvider, 'update')
      .mockResolvedValue(provider({ deletedAt: new Date() }));
    const hardDelete = jest.spyOn(prisma.settingPaymentProvider, 'delete');

    await service.deletePaymentProviderSetting('payrexx');

    expect(hardDelete).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].data['deletedAt']).toBeInstanceOf(Date);
  });

  test('warns to the log and to Sentry when the provider is still in use', async () => {
    jest
      .spyOn(prisma.settingPaymentProvider, 'findUnique')
      .mockResolvedValue(provider());
    jest
      .spyOn(prisma.paymentMethod, 'findMany')
      .mockResolvedValue([{ id: 'method-1' }] as never);
    jest.spyOn(prisma.subscription, 'count').mockResolvedValue(12);
    jest
      .spyOn(prisma.settingPaymentProvider, 'update')
      .mockResolvedValue(provider({ deletedAt: new Date() }));

    await service.deletePaymentProviderSetting('payrexx');

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('12 subscription(s)'),
      'warning'
    );
  });

  test('stays quiet when nothing depends on the provider', async () => {
    jest
      .spyOn(prisma.settingPaymentProvider, 'findUnique')
      .mockResolvedValue(provider());
    jest.spyOn(prisma.paymentMethod, 'findMany').mockResolvedValue([]);
    jest
      .spyOn(prisma.settingPaymentProvider, 'update')
      .mockResolvedValue(provider({ deletedAt: new Date() }));

    await service.deletePaymentProviderSetting('payrexx');

    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  test('adding a deleted provider back restores it without touching its config', async () => {
    const upsert = jest
      .spyOn(prisma.settingPaymentProvider, 'upsert')
      .mockResolvedValue(provider());

    await service.createPaymentProviderSetting({
      id: 'payrexx',
      name: 'Payrexx',
      type: 'PAYREXX',
    } as never);

    expect(upsert.mock.calls[0][0].update).toEqual({ deletedAt: null });
  });

  test('asks for the providers to be rebuilt after a change', async () => {
    jest
      .spyOn(prisma.settingPaymentProvider, 'findUnique')
      .mockResolvedValue(provider());
    jest
      .spyOn(prisma.settingPaymentProvider, 'update')
      .mockResolvedValue(provider());

    await service.updatePaymentProviderSetting({
      id: 'payrexx',
      name: 'Payrexx',
    } as never);

    expect(providerSettingsChanged.notify).toHaveBeenCalled();
  });
});
