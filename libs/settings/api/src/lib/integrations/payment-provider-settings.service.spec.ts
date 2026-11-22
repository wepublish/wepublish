import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentProviderType,
  PrismaClient,
  SettingPaymentProvider,
} from '@prisma/client';
import { NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ProviderSettingsChanged } from './provider-settings-changed';
import * as Sentry from '@sentry/nestjs';

vi.mock('@sentry/nestjs', () => ({ captureMessage: vi.fn() }));
import { PaymentProviderSettingsDataloaderService } from './payment-provider-settings-dataloader.service';
import { PaymentProviderSettingsService } from './payment-provider-settings.service';
import type { Mock } from 'vitest';

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
  let providerSettingsChanged: { notify: Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        PaymentProviderSettingsService,
        {
          provide: NamespaceResets,
          useValue: {
            reset: vi.fn(),
          } satisfies Pick<NamespaceResets, 'reset'>,
        },
        {
          provide: ProviderSettingsChanged,
          useValue: { notify: vi.fn() },
        },
        {
          provide: PaymentProviderSettingsDataloaderService,
          useValue: { prime: vi.fn() },
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
    vi.restoreAllMocks();
    vi.mocked(Sentry.captureMessage).mockClear();
  });

  test('hides deleted providers from the list', async () => {
    const findMany = vi
      .spyOn(prisma.settingPaymentProvider, 'findMany')
      .mockResolvedValue([]);

    await service.paymentProviderSettingsList();

    expect(findMany.mock.calls[0][0]?.where).toEqual({ deletedAt: null });
  });

  test('deleting only marks the row, so the provider keeps running', async () => {
    vi.spyOn(prisma.settingPaymentProvider, 'findUnique').mockResolvedValue(
      provider()
    );
    vi.spyOn(prisma.paymentMethod, 'findMany').mockResolvedValue([]);
    const update = vi
      .spyOn(prisma.settingPaymentProvider, 'update')
      .mockResolvedValue(provider({ deletedAt: new Date() }));
    const hardDelete = vi.spyOn(prisma.settingPaymentProvider, 'delete');

    await service.deletePaymentProviderSetting('payrexx');

    expect(hardDelete).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].data['deletedAt']).toBeInstanceOf(Date);
  });

  test('warns to the log and to Sentry when the provider is still in use', async () => {
    vi.spyOn(prisma.settingPaymentProvider, 'findUnique').mockResolvedValue(
      provider()
    );
    vi.spyOn(prisma.paymentMethod, 'findMany').mockResolvedValue([
      { id: 'method-1' },
    ] as never);
    vi.spyOn(prisma.subscription, 'count').mockResolvedValue(12);
    vi.spyOn(prisma.settingPaymentProvider, 'update').mockResolvedValue(
      provider({ deletedAt: new Date() })
    );

    await service.deletePaymentProviderSetting('payrexx');

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('12 subscription(s)'),
      'warning'
    );
  });

  test('stays quiet when nothing depends on the provider', async () => {
    vi.spyOn(prisma.settingPaymentProvider, 'findUnique').mockResolvedValue(
      provider()
    );
    vi.spyOn(prisma.paymentMethod, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.settingPaymentProvider, 'update').mockResolvedValue(
      provider({ deletedAt: new Date() })
    );

    await service.deletePaymentProviderSetting('payrexx');

    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  test('adding a deleted provider back restores it without touching its config', async () => {
    const upsert = vi
      .spyOn(prisma.settingPaymentProvider, 'upsert')
      .mockResolvedValue(provider());

    await service.createPaymentProviderSetting({
      id: 'payrexx',
      name: 'Payrexx',
      type: 'PAYREXX',
    } as never);

    expect(upsert.mock.calls[0][0].update).toEqual({ deletedAt: null });
  });

  describe('simulated payment provider', () => {
    const env = process.env;

    afterEach(() => {
      process.env = env;
    });

    const createSimulated = () =>
      service.createPaymentProviderSetting({
        id: 'simulated',
        name: 'Simulated',
        type: PaymentProviderType.SIMULATED,
      } as never);

    test('can be added outside of production', async () => {
      process.env = { ...env, APP_ENVIRONMENT: 'review' };
      const upsert = vi
        .spyOn(prisma.settingPaymentProvider, 'upsert')
        .mockResolvedValue(provider({ id: 'simulated' }));

      await createSimulated();

      expect(upsert).toHaveBeenCalled();
    });

    test('cannot be added on production', async () => {
      process.env = { ...env, APP_ENVIRONMENT: 'production' };
      const upsert = vi.spyOn(prisma.settingPaymentProvider, 'upsert');

      await expect(createSimulated()).rejects.toThrow(/production/);
      expect(upsert).not.toHaveBeenCalled();
    });
  });

  describe('bexio test mailbox', () => {
    const env = process.env;

    afterEach(() => {
      process.env = env;
    });

    const update = (bexio_testMailbox: string | null) => {
      vi.spyOn(prisma.settingPaymentProvider, 'findUnique').mockResolvedValue(
        provider({ id: 'bexio' })
      );

      return service.updatePaymentProviderSetting({
        id: 'bexio',
        bexio_testMailbox,
      } as never);
    };

    test('can be set outside of production', async () => {
      process.env = { ...env, APP_ENVIRONMENT: 'review' };
      const save = vi
        .spyOn(prisma.settingPaymentProvider, 'update')
        .mockResolvedValue(provider({ id: 'bexio' }));

      await update('bexio@test.example');

      expect(save.mock.calls[0][0].data).toMatchObject({
        bexio_testMailbox: 'bexio@test.example',
      });
    });

    test('cannot be set on production', async () => {
      process.env = { ...env, APP_ENVIRONMENT: 'production' };
      const save = vi.spyOn(prisma.settingPaymentProvider, 'update');

      await expect(update('bexio@test.example')).rejects.toThrow(/production/);
      expect(save).not.toHaveBeenCalled();
    });

    test('cannot be set on a deployment without APP_ENVIRONMENT', async () => {
      process.env = { ...env, APP_ENVIRONMENT: undefined };

      await expect(update('bexio@test.example')).rejects.toThrow(/production/);
    });

    test('can be cleared on production', async () => {
      process.env = { ...env, APP_ENVIRONMENT: 'production' };
      const save = vi
        .spyOn(prisma.settingPaymentProvider, 'update')
        .mockResolvedValue(provider({ id: 'bexio' }));

      await update(null);

      expect(save).toHaveBeenCalled();
    });

    test('cannot be created with one on production', async () => {
      process.env = { ...env, APP_ENVIRONMENT: 'production' };
      const upsert = vi.spyOn(prisma.settingPaymentProvider, 'upsert');

      await expect(
        service.createPaymentProviderSetting({
          id: 'bexio',
          name: 'bexio',
          type: PaymentProviderType.BEXIO,
          bexio_testMailbox: 'bexio@test.example',
        } as never)
      ).rejects.toThrow(/production/);
      expect(upsert).not.toHaveBeenCalled();
    });
  });

  test('asks for the providers to be rebuilt after a change', async () => {
    vi.spyOn(prisma.settingPaymentProvider, 'findUnique').mockResolvedValue(
      provider()
    );
    vi.spyOn(prisma.settingPaymentProvider, 'update').mockResolvedValue(
      provider()
    );

    await service.updatePaymentProviderSetting({
      id: 'payrexx',
      name: 'Payrexx',
    } as never);

    expect(providerSettingsChanged.notify).toHaveBeenCalled();
  });
});
