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
  invoiceDelivery: unknown = { deliverRenewal: vi.fn() },
  paymentProviders: unknown[] = []
) => {
  const service = new SubscriptionService(
    prisma as PrismaClient,
    memberContext as MemberContextService,
    { paymentProviders } as unknown as PaymentMethodConfig,
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
  // A subscription an editor creates comes with an open invoice. On a payment
  // provider that never charges nobody will ever pay it, so it is settled at
  // once, the way the provider settles it for a reader in the checkout.
  describe('creating a subscription', () => {
    const periodEnd = new Date('2125-12-31T00:00:00.000Z');
    const input = {
      userID: 'user-1',
      memberPlanID: 'plan-1',
      paymentMethodID: 'method-free',
    };
    const created = {
      subscription: { id: 'subscription-id', paidUntil: null },
      invoice: { id: 'inv-1', currency: 'CHF', items: [] },
    };
    const prismaFor = (paymentProviderID: string) => {
      const prisma = {
        paymentMethod: {
          findUnique: vi.fn(async () => ({
            id: 'method-free',
            paymentProviderID,
          })),
        },
        subscriptionPeriod: {
          findFirst: vi.fn(async () => ({ id: 'period-1', endsAt: periodEnd })),
        },
        payment: {
          create: vi.fn(async () => ({ id: 'payment-1' })),
          update: vi.fn(async () => ({ id: 'payment-1' })),
        },
        invoice: { update: vi.fn(async () => ({ id: 'inv-1' })) },
        subscription: {
          update: vi.fn(async () => ({
            id: 'subscription-id',
            paidUntil: periodEnd,
          })),
        },
        $transaction: vi.fn(async (operations: Promise<unknown>[]) =>
          Promise.all(operations)
        ),
      };

      return prisma;
    };
    const neverCharging = {
      id: 'gratis',
      settlesWithoutCharge: true,
      createIntent: vi.fn(async () => ({
        intentID: 'no_charge_1',
        intentSecret: '',
        intentData: '',
        state: 'paid',
        paidAt: new Date('2026-11-20T10:00:00.000Z'),
      })),
    };
    const charging = {
      id: 'bexio',
      settlesWithoutCharge: false,
      createIntent: vi.fn(),
    };
    const serviceFor = (prisma: unknown) =>
      makeService(
        prisma,
        { createSubscription: vi.fn(async () => created) },
        undefined,
        undefined,
        [neverCharging, charging]
      );

    beforeEach(() => {
      neverCharging.createIntent.mockClear();
      charging.createIntent.mockClear();
    });

    it('settles the invoice at once on a provider that never charges', async () => {
      const prisma = prismaFor('gratis');

      const subscription = await serviceFor(prisma).createSubscription(
        input as any
      );

      expect(neverCharging.createIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentID: 'payment-1',
          invoice: created.invoice,
        })
      );
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: expect.objectContaining({
            state: 'paid',
            intentID: 'no_charge_1',
          }),
        })
      );
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { paidAt: new Date('2026-11-20T10:00:00.000Z') },
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'subscription-id' },
          data: { paidUntil: periodEnd },
        })
      );
      expect(subscription.paidUntil).toEqual(periodEnd);
    });

    it('pays until the end of the period the invoice is for', async () => {
      const prisma = prismaFor('gratis');

      await serviceFor(prisma).createSubscription(input as any);

      expect(prisma.subscriptionPeriod.findFirst).toHaveBeenCalledWith({
        where: { invoiceID: 'inv-1' },
      });
    });

    it('leaves the invoice open on a provider that charges', async () => {
      const prisma = prismaFor('bexio');

      const subscription = await serviceFor(prisma).createSubscription(
        input as any
      );

      expect(charging.createIntent).not.toHaveBeenCalled();
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(prisma.invoice.update).not.toHaveBeenCalled();
      expect(subscription).toBe(created.subscription);
    });

    it('leaves the invoice open when the provider does not report it paid', async () => {
      const prisma = prismaFor('gratis');
      neverCharging.createIntent.mockResolvedValueOnce({
        intentID: 'x',
        intentSecret: '',
        intentData: '',
        state: 'processing',
      } as any);

      const subscription = await serviceFor(prisma).createSubscription(
        input as any
      );

      expect(prisma.invoice.update).not.toHaveBeenCalled();
      expect(subscription).toBe(created.subscription);
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
