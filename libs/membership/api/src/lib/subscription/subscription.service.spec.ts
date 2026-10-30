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

  describe('updateSubscriptionPaymentMethod', () => {
    const paymentMethods: Record<string, { id: string; active: boolean }> = {
      payrexx: { id: 'payrexx', active: true },
      bexio: { id: 'bexio', active: false },
    };

    const makePrisma = (
      subscription: {
        id: string;
        paymentMethodID: string;
        deactivation: { id: string } | null;
      } | null = {
        id: 'sub-1',
        paymentMethodID: 'payrexx',
        deactivation: { id: 'deactivation-1' },
      }
    ) => ({
      paymentMethod: {
        findUnique: vi.fn(
          async ({ where }: { where: { id: string } }) =>
            paymentMethods[where.id] ?? null
        ),
      },
      subscription: {
        findUnique: vi.fn(async () => subscription),
        updateMany: vi.fn(async () => ({
          count: subscription?.paymentMethodID === 'payrexx' ? 1 : 0,
        })),
      },
      invoice: { update: vi.fn(), delete: vi.fn() },
      subscriptionPeriod: { delete: vi.fn() },
    });

    const args = {
      subscriptionId: 'sub-1',
      fromPaymentMethodId: 'payrexx',
      toPaymentMethodId: 'bexio',
    };

    it('moves a subscription that is still on the old payment method', async () => {
      const prisma = makePrisma();

      await expect(
        makeService(prisma).updateSubscriptionPaymentMethod(args)
      ).resolves.toBe(true);
      // only while it is still on the old one, so a change made since is kept
      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { id: 'sub-1', paymentMethodID: 'payrexx' },
        data: { paymentMethodID: 'bexio' },
      });
    });

    it('leaves a subscription that is on another payment method', async () => {
      const prisma = makePrisma({
        id: 'sub-1',
        paymentMethodID: 'stripe',
        deactivation: null,
      });

      await expect(
        makeService(prisma).updateSubscriptionPaymentMethod(args)
      ).resolves.toBe(false);
    });

    // unlike updateSubscription: deactivated subscriptions are fine, and no
    // invoice, period or renewal is touched
    it('moves deactivated subscriptions without touching their billing', async () => {
      const prisma = makePrisma();
      const memberContext = {
        handleSubscriptionChange: vi.fn(),
        renewSubscriptionForUser: vi.fn(),
        updateRemoteSubscription: vi.fn(),
      };

      await makeService(prisma, memberContext).updateSubscriptionPaymentMethod(
        args
      );

      expect(memberContext.handleSubscriptionChange).not.toHaveBeenCalled();
      expect(memberContext.renewSubscriptionForUser).not.toHaveBeenCalled();
      expect(memberContext.updateRemoteSubscription).not.toHaveBeenCalled();
      expect(prisma.invoice.update).not.toHaveBeenCalled();
      expect(prisma.invoice.delete).not.toHaveBeenCalled();
      expect(prisma.subscriptionPeriod.delete).not.toHaveBeenCalled();
    });

    it('accepts an inactive target payment method', async () => {
      await expect(
        makeService(makePrisma()).updateSubscriptionPaymentMethod(args)
      ).resolves.toBe(true);
    });

    it('refuses an unknown subscription', async () => {
      const prisma = makePrisma(null);

      await expect(
        makeService(prisma).updateSubscriptionPaymentMethod(args)
      ).rejects.toThrow(NotFoundException);
      expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
    });

    it.each([
      ['an unknown target payment method', { toPaymentMethodId: 'unknown' }],
      ['an unknown source payment method', { fromPaymentMethodId: 'unknown' }],
    ])('refuses %s', async (_, override) => {
      const prisma = makePrisma();

      await expect(
        makeService(prisma).updateSubscriptionPaymentMethod({
          ...args,
          ...override,
        })
      ).rejects.toThrow(NotFoundException);
      expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
    });

    it('refuses moving to the same payment method', async () => {
      const prisma = makePrisma();

      await expect(
        makeService(prisma).updateSubscriptionPaymentMethod({
          ...args,
          toPaymentMethodId: 'payrexx',
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
    });
  });
});
