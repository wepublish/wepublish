import { PrismaClient } from '@prisma/client';
import { PaymentsService } from '../../payments.service';
import { BexioContactSyncService } from './bexio-contact-sync.service';
import { BexioPaymentProvider } from './bexio-payment-provider';

const reader = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'jane@example.com',
  modifiedAt: new Date('2026-10-01'),
  address: { modifiedAt: new Date('2026-10-01') },
  paymentProviderCustomers: [],
  ...overrides,
});

const link = (overrides: Record<string, unknown> = {}) => ({
  userId: 'user-1',
  paymentProviderID: 'bexio',
  customerID: '542',
  syncedAt: null,
  User: reader(),
  ...overrides,
});

function setup({
  enabled = true,
  known = [] as ReturnType<typeof link>[],
  unknown = [] as ReturnType<typeof reader>[],
} = {}) {
  // A real provider instance is not needed; the service recognises bexio
  // providers by their class.
  const provider = Object.assign(
    Object.create(BexioPaymentProvider.prototype),
    {
      id: 'bexio',
      getConfig: vi.fn(async () => ({ bexio_contactSync: enabled })),
      syncContact: vi.fn(async () => 'edited'),
    }
  );
  const prisma = {
    paymentProviderCustomer: { findMany: vi.fn(async () => known) },
    user: { findMany: vi.fn(async () => unknown) },
    settingPaymentProvider: { update: vi.fn() },
  };
  const payments = { getProviders: () => [provider, { id: 'stripe' }] };
  const service = new BexioContactSyncService(
    prisma as unknown as PrismaClient,
    payments as unknown as PaymentsService
  );
  (service as any).pauseMs = 0;

  return { service, provider, prisma };
}

describe('BexioContactSyncService', () => {
  it('does nothing while the switch is off', async () => {
    const { service, provider, prisma } = setup({ enabled: false });

    await service.syncAll();

    expect(prisma.paymentProviderCustomer.findMany).not.toHaveBeenCalled();
    expect(provider.syncContact).not.toHaveBeenCalled();
    expect(prisma.settingPaymentProvider.update).not.toHaveBeenCalled();
  });

  it('pushes readers never pushed and readers changed since their last push', async () => {
    const { service, provider } = setup({
      known: [
        link(),
        link({
          userId: 'user-2',
          syncedAt: new Date('2026-10-20'),
          User: reader({
            id: 'user-2',
            address: { modifiedAt: new Date('2026-10-25') },
          }),
        }),
        link({
          userId: 'user-3',
          syncedAt: new Date('2026-10-20'),
          User: reader({ id: 'user-3', address: null }),
        }),
      ],
    });

    await service.syncAll();

    const pushed = provider.syncContact.mock.calls.map(
      ([user]: [{ id: string }]) => user.id
    );
    expect(pushed).toEqual(['user-1', 'user-2']);
  });

  it('creates contacts for readers paying through bexio that bexio does not know yet', async () => {
    const { service, provider, prisma } = setup({
      unknown: [reader({ id: 'user-9' })],
    });

    await service.syncAll();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          paymentProviderCustomers: { none: { paymentProviderID: 'bexio' } },
          subscriptions: {
            some: expect.objectContaining({
              paymentMethod: { paymentProviderID: 'bexio' },
            }),
          },
        }),
      })
    );
    expect(provider.syncContact).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-9' })
    );
  });

  it('records the run on the integration, failures included', async () => {
    const { service, provider, prisma } = setup({
      known: [
        link(),
        link({ userId: 'user-2', User: reader({ id: 'user-2' }) }),
      ],
    });
    provider.syncContact.mockRejectedValueOnce(new Error('boom'));

    await service.syncAll();

    expect(provider.syncContact).toHaveBeenCalledTimes(2);
    expect(prisma.settingPaymentProvider.update).toHaveBeenCalledWith({
      where: { id: 'bexio' },
      data: {
        bexio_contactSyncAt: expect.any(Date),
        bexio_contactSyncError: '1 of 2 readers failed: boom',
      },
    });
  });

  it('records a clean run without an error', async () => {
    const { service, prisma } = setup({ known: [link()] });

    await service.syncAll();

    expect(prisma.settingPaymentProvider.update).toHaveBeenCalledWith({
      where: { id: 'bexio' },
      data: {
        bexio_contactSyncAt: expect.any(Date),
        bexio_contactSyncError: null,
      },
    });
  });

  it('stops when bexio rate-limits and leaves the rest for the next night', async () => {
    const { service, provider, prisma } = setup({
      known: [
        link(),
        link({ userId: 'user-2', User: reader({ id: 'user-2' }) }),
      ],
    });
    provider.syncContact.mockRejectedValueOnce({
      code: 429,
      message: 'Too Many Requests',
    });

    await service.syncAll();

    expect(provider.syncContact).toHaveBeenCalledTimes(1);
    expect(prisma.settingPaymentProvider.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bexio_contactSyncError: expect.stringContaining('429'),
        }),
      })
    );
  });
});
