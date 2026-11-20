import { PrismaClient } from '@prisma/client';
import { InvoicePaidNotifier } from '@wepublish/payment/api';

import {
  isLegacySubscription,
  legacySubscriptionWhere,
} from './legacy-subscription';
import { LegacySubscriptionService } from './legacy-subscription.service';

const IMPORTED_AT = new Date('2026-11-01T08:00:00Z');
const NOW = new Date('2026-11-19T10:00:00Z');

describe('isLegacySubscription', () => {
  it('is false for a subscription created in we.publish', () => {
    expect(
      isLegacySubscription({ importedAt: null, legacyEndedAt: null })
    ).toBe(false);
  });

  it('is true for an imported subscription nobody paid for here yet', () => {
    expect(
      isLegacySubscription({ importedAt: IMPORTED_AT, legacyEndedAt: null })
    ).toBe(true);
  });

  it('is false once a payment was registered here', () => {
    expect(
      isLegacySubscription({ importedAt: IMPORTED_AT, legacyEndedAt: NOW })
    ).toBe(false);
  });
});

describe('legacySubscriptionWhere', () => {
  it('selects imported subscriptions whose legacy state has not ended', () => {
    expect(legacySubscriptionWhere(true)).toEqual({
      importedAt: { not: null },
      legacyEndedAt: null,
    });
  });

  it('selects everything else as the complement', () => {
    expect(legacySubscriptionWhere(false)).toEqual({
      OR: [{ importedAt: null }, { legacyEndedAt: { not: null } }],
    });
  });
});

describe('LegacySubscriptionService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = () => {
    const prisma = {
      subscription: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    const notifier = new InvoicePaidNotifier();
    const service = new LegacySubscriptionService(
      prisma as unknown as PrismaClient,
      notifier
    );

    return { prisma, notifier, service };
  };

  it('ends the legacy state of the subscription a paid invoice belongs to', async () => {
    const { prisma, service } = setup();

    await service.onInvoicePaid('invoice-1');

    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: {
        invoices: { some: { id: 'invoice-1' } },
        importedAt: { not: null },
        legacyEndedAt: null,
      },
      data: { legacyEndedAt: NOW },
    });
  });

  it('listens to paid invoices once the module is up', async () => {
    const { prisma, notifier, service } = setup();

    service.onModuleInit();
    await notifier.notify('invoice-1');

    expect(prisma.subscription.updateMany).toHaveBeenCalledTimes(1);
  });

  // The renewal mail of the payment that ends the legacy state still has to
  // come from the legacy flow, so that mail is looked up first.
  it('runs after the renewal mail listener', async () => {
    const order: string[] = [];
    const prisma = {
      subscription: {
        updateMany: vi.fn().mockImplementation(async () => {
          order.push('legacy-ended');
          return { count: 1 };
        }),
      },
    };
    const notifier = new InvoicePaidNotifier({
      onInvoicePaid: async () => {
        order.push('renewal-mail');
      },
    });
    new LegacySubscriptionService(
      prisma as unknown as PrismaClient,
      notifier
    ).onModuleInit();

    await notifier.notify('invoice-1');

    expect(order).toEqual(['renewal-mail', 'legacy-ended']);
  });
});
