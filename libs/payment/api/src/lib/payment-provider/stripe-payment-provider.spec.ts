import { Currency, PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import express from 'express';
import { StripePaymentProvider } from './stripe-payment-provider';

const harnesses: NamespacedCacheTesting[] = [];

afterEach(async () => {
  await Promise.all(harnesses.splice(0).map(testing => testing.close()));
});

describe('StripePaymentProvider', () => {
  let provider: StripePaymentProvider;
  let stripe: {
    setupIntents: { create: any; retrieve: any };
    customers: { create: any; update: any };
    webhooks: { constructEvent: any };
  };

  const setupIntent = (overrides: Record<string, unknown> = {}) => ({
    id: 'seti_1',
    object: 'setup_intent',
    client_secret: 'seti_1_secret',
    status: 'requires_payment_method',
    customer: null,
    payment_method: null,
    metadata: { changeID: 'change-1', mail: 'reader@example.com' },
    ...overrides,
  });

  beforeEach(async () => {
    const testing = await createNamespacedCacheTesting();
    harnesses.push(testing);
    const kv = testing.cache;
    await kv.setNs(
      'settings:paymentprovider',
      'stripe',
      {
        id: 'stripe',
        type: 'stripe',
        name: 'Stripe',
        offSessionPayments: true,
        apiKey: 'sk_test',
        webhookEndpointSecret: 'whsec',
        stripe_methods: ['CARD'],
      },
      60
    );

    stripe = {
      setupIntents: {
        create: vi.fn().mockResolvedValue(setupIntent()),
        retrieve: vi.fn(),
      },
      customers: {
        create: vi.fn().mockResolvedValue({ id: 'cus_new' }),
        update: vi.fn().mockResolvedValue({ id: 'cus_known' }),
      },
      webhooks: { constructEvent: vi.fn() },
    };

    provider = new StripePaymentProvider({
      id: 'stripe',
      prisma: {} as PrismaClient,
      kv,
      resets: testing.resets,
    });
    vi.spyOn(provider, 'getStripeGateway').mockResolvedValue(stripe as any);
  });

  describe('authorization', () => {
    it('supports authorizing a payment method without a charge', () => {
      expect(provider.supportsAuthorization()).toBe(true);
    });

    it('creates a SetupIntent for off-session use and nothing is held', async () => {
      const intent = await provider.createAuthorizationIntent({
        changeID: 'change-1',
        currency: Currency.CHF,
        email: 'reader@example.com',
      });

      expect(stripe.setupIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usage: 'off_session',
          payment_method_types: ['card'],
          metadata: { changeID: 'change-1', mail: 'reader@example.com' },
        })
      );
      expect(stripe.setupIntents.create.mock.calls[0][0]).not.toHaveProperty(
        'customer'
      );
      expect(intent).toEqual(
        expect.objectContaining({
          intentID: 'seti_1',
          intentSecret: 'seti_1_secret',
          state: 'processing',
          amount: 0,
        })
      );
    });

    it('attaches the SetupIntent to a customer Stripe already knows', async () => {
      await provider.createAuthorizationIntent({
        changeID: 'change-1',
        currency: Currency.CHF,
        customerID: 'cus_known',
      });

      expect(stripe.setupIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_known' })
      );
    });

    it('creates a customer with the confirmed card as default', async () => {
      stripe.setupIntents.retrieve.mockResolvedValue(
        setupIntent({ status: 'succeeded', payment_method: 'pm_1' })
      );

      const state = await provider.checkAuthorizationStatus({
        intentID: 'seti_1',
        changeID: 'change-1',
      });

      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'reader@example.com',
        payment_method: 'pm_1',
        invoice_settings: { default_payment_method: 'pm_1' },
      });
      expect(state).toEqual(
        expect.objectContaining({
          changeID: 'change-1',
          state: 'authorized',
          customerID: 'cus_new',
        })
      );
    });

    it('makes the confirmed card the default of a known customer', async () => {
      stripe.setupIntents.retrieve.mockResolvedValue(
        setupIntent({
          status: 'succeeded',
          payment_method: 'pm_1',
          customer: 'cus_known',
        })
      );

      const state = await provider.checkAuthorizationStatus({
        intentID: 'seti_1',
        changeID: 'change-1',
      });

      expect(stripe.customers.update).toHaveBeenCalledWith('cus_known', {
        invoice_settings: { default_payment_method: 'pm_1' },
      });
      expect(stripe.customers.create).not.toHaveBeenCalled();
      expect(state?.customerID).toBe('cus_known');
    });

    it('reports a SetupIntent waiting for the reader as processing', async () => {
      stripe.setupIntents.retrieve.mockResolvedValue(
        setupIntent({ status: 'requires_action' })
      );

      const state = await provider.checkAuthorizationStatus({
        intentID: 'seti_1',
        changeID: 'change-1',
      });

      expect(state).toEqual(
        expect.objectContaining({ state: 'processing', customerID: undefined })
      );
    });

    const webhook = (type: string, object: unknown) => {
      stripe.webhooks.constructEvent.mockReturnValue({
        type,
        data: { object },
      });

      return provider.webhookForPaymentIntent({
        req: {
          headers: { 'stripe-signature': 'sig' },
          body: '{}',
        } as unknown as express.Request,
      });
    };

    it('reports a succeeded SetupIntent from the webhook', async () => {
      const response = await webhook(
        'setup_intent.succeeded',
        setupIntent({ status: 'succeeded', payment_method: 'pm_1' })
      );

      expect(response.paymentStates).toBeUndefined();
      expect(response.authorizationStates).toEqual([
        expect.objectContaining({
          changeID: 'change-1',
          state: 'authorized',
          customerID: 'cus_new',
        }),
      ]);
    });

    it('reports a failed SetupIntent from the webhook', async () => {
      const response = await webhook(
        'setup_intent.setup_failed',
        setupIntent({ status: 'requires_payment_method' })
      );

      expect(response.authorizationStates).toEqual([
        expect.objectContaining({ changeID: 'change-1', state: 'failed' }),
      ]);
    });

    it('ignores SetupIntents that do not belong to a payment method change', async () => {
      const response = await webhook(
        'setup_intent.succeeded',
        setupIntent({ status: 'succeeded', metadata: {} })
      );

      expect(response.authorizationStates).toEqual([]);
    });

    it('has nothing to release', async () => {
      await expect(
        provider.releaseAuthorization({ intentID: 'seti_1' })
      ).resolves.toBeUndefined();
    });
  });
});
