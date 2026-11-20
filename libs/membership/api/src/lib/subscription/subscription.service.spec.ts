import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MemberContextService } from '../legacy/member-context.service';
import { PaymentMethodConfig } from '@wepublish/payment/api';
import { FeaturesService } from '@wepublish/features/api';
import { InvoiceDeliveryService } from '../periodic-job/invoice-delivery.service';
import { SubscriptionService } from './subscription.service';

const makeService = (
  prisma: unknown,
  memberContext: unknown = {},
  features: unknown = { isEnabled: vi.fn(async () => false) },
  invoiceDelivery: unknown = { deliverRenewal: vi.fn() }
) => {
  const service = new SubscriptionService(
    prisma as PrismaClient,
    memberContext as MemberContextService,
    { paymentProviders: [] } as unknown as PaymentMethodConfig,
    features as FeaturesService,
    invoiceDelivery as InvoiceDeliveryService
  );

  // @PrimeDataLoader injects the dataloader as a property, which Nest does not
  // do for a manually constructed service.
  (service as any)['__DATALOADER__SubscriptionDataloader'] = {
    prime: vi.fn(),
  };

  return service;
};

describe('SubscriptionService', () => {
  // A subscription sold or imported with the wrong terms (a trial as a year)
  // keeps them on its period, and the print export goes by the period. This
  // corrects the period and the subscription together and touches nothing else.
  describe('correcting the terms of a period', () => {
    const start = new Date('2026-10-21T00:00:00.000Z');
    const yearEnd = new Date('2027-10-20T00:00:00.000Z');
    const halfYearEnd = new Date('2027-04-20T00:00:00.000Z');
    const period = {
      id: 'period-1',
      startsAt: start,
      endsAt: yearEnd,
      amount: 2000,
      paymentPeriodicity: 'yearly',
      invoiceID: 'inv-1',
    };
    const subscription = (overrides: Record<string, unknown> = {}) => ({
      id: 'subscription-id',
      paymentPeriodicity: 'yearly',
      monthlyAmount: 2000 / 12,
      paidUntil: yearEnd,
      deactivation: null,
      periods: [period],
      invoices: [{ id: 'inv-1', paidAt: start, canceledAt: null }],
      ...overrides,
    });
    const prismaFor = (found: unknown) => {
      const prisma = {
        subscription: {
          findUnique: vi.fn(async () => found),
          update: vi.fn(async ({ data }: { data: object }) => ({
            id: 'subscription-id',
            ...data,
          })),
        },
        subscriptionPeriod: { update: vi.fn(async () => ({})) },
        $transaction: vi.fn(async (operations: Promise<unknown>[]) =>
          Promise.all(operations)
        ),
      };

      return prisma;
    };
    const args = {
      subscriptionId: 'subscription-id',
      periodId: 'period-1',
      paymentPeriodicity: 'biannual',
      endsAt: halfYearEnd,
    } as any;

    it('gives the period its periodicity and end', async () => {
      const prisma = prismaFor(subscription());

      await makeService(prisma).correctSubscriptionPeriod(args);

      expect(prisma.subscriptionPeriod.update).toHaveBeenCalledWith({
        where: { id: 'period-1' },
        data: { paymentPeriodicity: 'biannual', endsAt: halfYearEnd },
      });
    });

    it('moves the subscription with it and keeps the price of the period', async () => {
      const prisma = prismaFor(subscription());

      const corrected =
        await makeService(prisma).correctSubscriptionPeriod(args);

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'subscription-id' },
          data: {
            paymentPeriodicity: 'biannual',
            monthlyAmount: 2000 / 6,
            paidUntil: halfYearEnd,
          },
        })
      );
      expect(corrected.paidUntil).toEqual(halfYearEnd);
    });

    it('leaves a paid-until that is not the end of this period', async () => {
      const elsewhere = new Date('2027-12-31T00:00:00.000Z');
      const prisma = prismaFor(subscription({ paidUntil: elsewhere }));

      await makeService(prisma).correctSubscriptionPeriod(args);

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { paymentPeriodicity: 'biannual', monthlyAmount: 2000 / 6 },
        })
      );
    });

    it.each([
      ['a subscription that does not exist', null, NotFoundException],
      [
        'a deactivated subscription',
        subscription({ deactivation: { id: 'd' } }),
        BadRequestException,
      ],
      [
        'a period of another subscription',
        subscription({ periods: [{ ...period, id: 'other' }] }),
        NotFoundException,
      ],
      [
        'a period that is not the latest',
        subscription({
          periods: [
            period,
            {
              ...period,
              id: 'later',
              startsAt: new Date('2027-10-21T00:00:00.000Z'),
              endsAt: new Date('2028-10-20T00:00:00.000Z'),
              invoiceID: 'inv-2',
            },
          ],
        }),
        BadRequestException,
      ],
      [
        'a period whose invoice is not paid',
        subscription({
          invoices: [{ id: 'inv-1', paidAt: null, canceledAt: null }],
        }),
        BadRequestException,
      ],
      [
        'a subscription with another open invoice',
        subscription({
          invoices: [
            { id: 'inv-1', paidAt: start, canceledAt: null },
            { id: 'inv-2', paidAt: null, canceledAt: null },
          ],
        }),
        BadRequestException,
      ],
    ])('refuses %s and writes nothing', async (_name, found, error) => {
      const prisma = prismaFor(found);

      await expect(
        makeService(prisma).correctSubscriptionPeriod(args)
      ).rejects.toBeInstanceOf(error);
      expect(prisma.subscriptionPeriod.update).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('refuses an end that is not after the start', async () => {
      const prisma = prismaFor(subscription());

      await expect(
        makeService(prisma).correctSubscriptionPeriod({ ...args, endsAt: start })
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.subscriptionPeriod.update).not.toHaveBeenCalled();
    });
  });

  // With the feature on, an invoice an editor created is handled like the
  // nightly job's: created at the payment provider and mailed or printed.
  describe('handing an editor-created invoice to the payment provider', () => {
    const invoice = { id: 'inv-1', items: [] };
    const subscription = {
      id: 'subscription-id',
      userID: 'user-1',
      paidUntil: new Date('2020-01-01'),
      periods: [],
      deactivation: null,
      user: { id: 'user-1', email: 'jane@example.com' },
    };
    const prismaFor = () => ({
      subscription: { findUnique: vi.fn(async () => subscription) },
      invoice: { count: vi.fn(async () => 0) },
      subscriptionDeactivation: { delete: vi.fn() },
    });
    const on = { isEnabled: vi.fn(async () => true) };
    const off = { isEnabled: vi.fn(async () => false) };

    it('leaves the provider out of it while the feature is off', async () => {
      const memberContext = {
        renewSubscriptionForUser: vi.fn(async () => invoice),
      };
      const invoiceDelivery = { deliverRenewal: vi.fn() };

      await makeService(
        prismaFor(),
        memberContext,
        off,
        invoiceDelivery
      ).renewSubscription('subscription-id');

      expect(memberContext.renewSubscriptionForUser).toHaveBeenCalled();
      expect(off.isEnabled).toHaveBeenCalledWith(
        'editor-renewal-provider-invoice'
      );
      expect(invoiceDelivery.deliverRenewal).not.toHaveBeenCalled();
    });

    it('hands the new invoice over when renewing with the feature on', async () => {
      const invoiceDelivery = { deliverRenewal: vi.fn() };

      await makeService(
        prismaFor(),
        { renewSubscriptionForUser: vi.fn(async () => invoice) },
        on,
        invoiceDelivery
      ).renewSubscription('subscription-id');

      expect(invoiceDelivery.deliverRenewal).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subscription-id',
          user: expect.objectContaining({ id: 'user-1' }),
        }),
        invoice
      );
    });

    it('hands the new invoice over when reactivating with the feature on', async () => {
      const invoiceDelivery = { deliverRenewal: vi.fn() };
      const prisma = prismaFor();
      prisma.subscription.findUnique.mockResolvedValue({
        ...subscription,
        deactivation: { id: 'deactivation-id' },
      });

      await makeService(
        prisma,
        { renewSubscriptionForUser: vi.fn(async () => invoice) },
        on,
        invoiceDelivery
      ).reactivateSubscription('subscription-id');

      expect(invoiceDelivery.deliverRenewal).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'subscription-id' }),
        invoice
      );
    });

    it('has nothing to hand over when no invoice was created', async () => {
      const invoiceDelivery = { deliverRenewal: vi.fn() };

      await makeService(
        prismaFor(),
        { renewSubscriptionForUser: vi.fn(async () => null) },
        on,
        invoiceDelivery
      ).renewSubscription('subscription-id');

      expect(invoiceDelivery.deliverRenewal).not.toHaveBeenCalled();
    });
  });

  describe('reactivateSubscription', () => {
    it('removes the deactivation of a deactivated subscription', async () => {
      const deactivated = {
        id: 'subscription-id',
        deactivation: {
          id: 'deactivation-id',
          subscriptionID: 'subscription-id',
        },
      };
      const prisma = {
        subscription: {
          findUnique: vi.fn(async () => deactivated),
        },
        subscriptionDeactivation: {
          delete: vi.fn(async () => deactivated.deactivation),
        },
      };

      const result = await makeService(prisma, {
        renewSubscriptionForUser: vi.fn(),
      }).reactivateSubscription('subscription-id');

      expect(prisma.subscriptionDeactivation.delete).toHaveBeenCalledWith({
        where: { subscriptionID: 'subscription-id' },
      });
      expect(result).toMatchObject({ id: 'subscription-id' });
      expect(result.deactivation).toBeNull();
    });

    it('invoices the subscription again when its period has run out', async () => {
      const deactivated = {
        id: 'subscription-id',
        paidUntil: new Date('2020-01-01'),
        periods: [],
        deactivation: { id: 'deactivation-id' },
      };
      const prisma = {
        subscription: { findUnique: vi.fn(async () => deactivated) },
        subscriptionDeactivation: { delete: vi.fn() },
      };
      const memberContext = { renewSubscriptionForUser: vi.fn() };

      await makeService(prisma, memberContext).reactivateSubscription(
        'subscription-id'
      );

      expect(memberContext.renewSubscriptionForUser).toHaveBeenCalledWith({
        // the deactivation has to be gone, a deactivated subscription is not renewed
        subscription: expect.objectContaining({
          id: 'subscription-id',
          deactivation: null,
        }),
      });
    });

    it('leaves a still paid subscription without a new invoice', async () => {
      const deactivated = {
        id: 'subscription-id',
        paidUntil: new Date('2999-01-01'),
        periods: [],
        deactivation: { id: 'deactivation-id' },
      };
      const prisma = {
        subscription: { findUnique: vi.fn(async () => deactivated) },
        subscriptionDeactivation: { delete: vi.fn() },
      };
      const memberContext = { renewSubscriptionForUser: vi.fn() };

      await makeService(prisma, memberContext).reactivateSubscription(
        'subscription-id'
      );

      expect(memberContext.renewSubscriptionForUser).not.toHaveBeenCalled();
    });

    it('throws when the subscription does not exist', async () => {
      const prisma = {
        subscription: { findUnique: vi.fn(async () => null) },
        subscriptionDeactivation: { delete: vi.fn() },
      };

      await expect(
        makeService(prisma).reactivateSubscription('missing-id')
      ).rejects.toThrow(NotFoundException);
      expect(prisma.subscriptionDeactivation.delete).not.toHaveBeenCalled();
    });

    it('throws when the subscription is not deactivated', async () => {
      const prisma = {
        subscription: {
          findUnique: vi.fn(async () => ({
            id: 'subscription-id',
            deactivation: null,
          })),
        },
        subscriptionDeactivation: { delete: vi.fn() },
      };

      await expect(
        makeService(prisma).reactivateSubscription('subscription-id')
      ).rejects.toThrow(BadRequestException);
      expect(prisma.subscriptionDeactivation.delete).not.toHaveBeenCalled();
    });
  });
});
