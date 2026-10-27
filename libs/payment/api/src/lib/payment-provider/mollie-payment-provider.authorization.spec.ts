import { Currency, PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import express from 'express';
import { MolliePaymentProvider } from './mollie-payment-provider';

const harnesses: NamespacedCacheTesting[] = [];

afterEach(async () => {
  await Promise.all(harnesses.splice(0).map(testing => testing.close()));
});

describe('MolliePaymentProvider authorization', () => {
  let provider: MolliePaymentProvider;
  let mollie: {
    payments: { create: any; get: any };
    customers: { create: any };
  };
  let fetchMock: ReturnType<typeof vi.fn>;

  const molliePayment = (overrides: Record<string, unknown> = {}) => ({
    id: 'tr_1',
    status: 'open',
    customerId: 'cst_1',
    metadata: { changeID: 'change-1', mail: 'reader@example.com' },
    getCheckoutUrl: () => 'https://www.mollie.com/checkout/tr_1',
    ...overrides,
  });

  beforeEach(async () => {
    const testing = await createNamespacedCacheTesting();
    harnesses.push(testing);
    const kv = testing.cache;
    await kv.setNs(
      'settings:paymentprovider',
      'mollie',
      {
        id: 'mollie',
        type: 'mollie',
        name: 'Mollie',
        offSessionPayments: true,
        apiKey: 'test_key',
        webhookEndpointSecret: 'secret',
        mollie_apiBaseUrl: 'https://api.example.com',
        mollie_methods: ['CREDITCARD'],
      },
      60
    );

    mollie = {
      payments: {
        create: vi.fn().mockResolvedValue(molliePayment()),
        get: vi.fn(),
      },
      customers: { create: vi.fn().mockResolvedValue({ id: 'cst_new' }) },
    };

    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal('fetch', fetchMock);

    provider = new MolliePaymentProvider({
      id: 'mollie',
      prisma: {} as PrismaClient,
      kv,
      resets: testing.resets,
    });
    vi.spyOn(provider, 'getMollieGateway').mockResolvedValue(mollie as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('supports authorizing a payment method without a charge', () => {
    expect(provider.supportsAuthorization()).toBe(true);
  });

  it('places a 0.01 hold as a first payment of a new customer', async () => {
    const intent = await provider.createAuthorizationIntent({
      changeID: 'change-1',
      currency: Currency.CHF,
      email: 'reader@example.com',
      successURL: 'https://site.example.com/success',
    });

    expect(mollie.customers.create).toHaveBeenCalledWith({
      email: 'reader@example.com',
      name: 'reader@example.com',
    });
    expect(mollie.payments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cst_new',
        amount: { currency: Currency.CHF, value: '0.01' },
        sequenceType: 'first',
        captureMode: 'manual',
        redirectUrl: 'https://site.example.com/success',
        webhookUrl:
          'https://api.example.com/payment-webhooks/mollie?key=secret',
        metadata: { changeID: 'change-1', mail: 'reader@example.com' },
      })
    );
    expect(intent).toEqual(
      expect.objectContaining({
        intentID: 'tr_1',
        intentSecret: 'https://www.mollie.com/checkout/tr_1',
        state: 'processing',
        amount: 1,
      })
    );
  });

  it('reuses a customer Mollie already knows', async () => {
    await provider.createAuthorizationIntent({
      changeID: 'change-1',
      currency: Currency.CHF,
      customerID: 'cst_known',
    });

    expect(mollie.customers.create).not.toHaveBeenCalled();
    expect(mollie.payments.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cst_known' })
    );
  });

  it.each([
    ['authorized', 'authorized', 'cst_1'],
    ['open', 'processing', undefined],
    ['pending', 'processing', undefined],
    ['failed', 'failed', undefined],
    ['canceled', 'failed', undefined],
    ['expired', 'failed', undefined],
  ])('maps a %s hold to %s', async (status, state, customerID) => {
    mollie.payments.get.mockResolvedValue(molliePayment({ status }));

    const result = await provider.checkAuthorizationStatus({
      intentID: 'tr_1',
      changeID: 'change-1',
    });

    expect(result).toEqual(
      expect.objectContaining({ changeID: 'change-1', state, customerID })
    );
  });

  it('reports the hold from the webhook instead of a payment state', async () => {
    mollie.payments.get.mockResolvedValue(
      molliePayment({ status: 'authorized' })
    );

    const response = await provider.webhookForPaymentIntent({
      req: {
        query: { key: 'secret' },
        body: { id: 'tr_1' },
      } as unknown as express.Request,
    });

    expect(response.paymentStates).toEqual([]);
    expect(response.authorizationStates).toEqual([
      expect.objectContaining({
        changeID: 'change-1',
        state: 'authorized',
        customerID: 'cst_1',
      }),
    ]);
  });

  it('releases the hold so the reader is never charged', async () => {
    await provider.releaseAuthorization({ intentID: 'tr_1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mollie.com/v2/payments/tr_1/release-authorization',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test_key' }),
      })
    );
  });

  it('fails loudly when Mollie refuses to release the hold', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'not releasable',
    });

    await expect(
      provider.releaseAuthorization({ intentID: 'tr_1' })
    ).rejects.toThrow('422');
  });
});
