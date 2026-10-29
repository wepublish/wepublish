import { Gateway, GatewayClient } from '../payrexx/gateway-client';
import { Transaction, TransactionClient } from '../payrexx/transaction-client';
import { PayrexxPaymentProvider } from './payrexx-payment-provider';
import type { NodeRequest } from '@nestjs/platform-node';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { prismaDecimalCodec } from '@wepublish/kv-ttl-cache/api/prisma';
import { Currency, Prisma, PrismaClient } from '@prisma/client';

const harnesses: NamespacedCacheTesting[] = [];

afterEach(async () => {
  await Promise.all(harnesses.splice(0).map(testing => testing.close()));
});

describe('PayrexxPaymentProvider authorization', () => {
  let payrexx: PayrexxPaymentProvider;
  let gatewayClient: { createGateway: any; getGateway: any };
  let transactionClient: {
    retrieveTransaction: any;
    chargePreAuthorizedTransaction: any;
  };

  const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 4711,
    uuid: 'uuid',
    referenceId: 'pmc_change-1',
    time: '',
    status: 'authorized',
    lang: 'de',
    psp: 'TWINT',
    amount: 1,
    subscription: null,
    ...overrides,
  });

  beforeEach(async () => {
    gatewayClient = {
      createGateway: vi.fn().mockResolvedValue({
        id: 42,
        link: 'https://instancename.payrexx.com/pay?tid=42',
      }),
      getGateway: vi.fn(),
    };
    transactionClient = {
      retrieveTransaction: vi.fn(),
      chargePreAuthorizedTransaction: vi.fn(),
    };

    class PayrexxFactoryMock {
      get gatewayClient() {
        return gatewayClient as unknown as GatewayClient;
      }

      get transactionClient() {
        return transactionClient as unknown as TransactionClient;
      }
    }

    const testing = await createNamespacedCacheTesting({
      codec: prismaDecimalCodec,
    });
    harnesses.push(testing);
    const kv = testing.cache;
    await kv.setNs(
      'settings:paymentprovider',
      'payrexx',
      {
        id: 'payrexx',
        type: 'payrexx',
        name: 'Payrexx',
        offSessionPayments: true,
        apiKey: 'key',
        webhookEndpointSecret: 'secret',
        payrexx_instancename: 'instancename',
        payrexx_psp: ['TWINT'],
        payrexx_pm: ['TWINT'],
        payrexx_vatrate: new Prisma.Decimal('8.1'),
      },
      60
    );

    payrexx = new PayrexxPaymentProvider({
      id: 'payrexx',
      prisma: {} as PrismaClient,
      kv,
      resets: testing.resets,
    });
    payrexx.overridePayrexxFactory(PayrexxFactoryMock as any);
  });

  it('supports authorizing a payment method without a charge', () => {
    expect(payrexx.supportsAuthorization()).toBe(true);
  });

  it('tokenizes with a 0.01 gateway that is not charged on authorization', async () => {
    const intent = await payrexx.createAuthorizationIntent({
      changeID: 'change-1',
      currency: Currency.CHF,
      email: 'reader@example.com',
      successURL: 'https://site.example.com/success',
      failureURL: 'https://site.example.com/failure',
    });

    expect(gatewayClient.createGateway).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceId: 'pmc_change-1',
        amount: 1,
        currency: Currency.CHF,
        preAuthorization: true,
        chargeOnAuthorization: false,
        fields: { email: { value: 'reader@example.com' } },
        successRedirectUrl: 'https://site.example.com/success',
        failedRedirectUrl: 'https://site.example.com/failure',
        cancelRedirectUrl: 'https://site.example.com/failure',
      })
    );
    expect(intent).toEqual(
      expect.objectContaining({
        intentID: '42',
        intentSecret: 'https://instancename.payrexx.com/pay?tid=42',
        state: 'processing',
        amount: 1,
      })
    );
  });

  const webhook = (body: unknown) =>
    payrexx.webhookForPaymentIntent({
      req: {
        query: { apiKey: 'secret' },
        headers: { 'content-type': 'application/json' },
        body,
      } as unknown as NodeRequest,
    });

  it('stores the authorized transaction as the token', async () => {
    const response = await webhook({ transaction: transaction() });

    expect(response.paymentStates).toBeUndefined();
    expect(response.authorizationStates).toEqual([
      expect.objectContaining({
        changeID: 'change-1',
        state: 'authorized',
        customerID: '4711',
      }),
    ]);
  });

  it.each([
    ['waiting', 'processing'],
    ['declined', 'failed'],
    ['cancelled', 'failed'],
    ['error', 'failed'],
  ] as const)('maps a %s authorization to %s', async (status, state) => {
    const response = await webhook({ transaction: transaction({ status }) });

    expect(response.authorizationStates).toEqual([
      expect.objectContaining({ changeID: 'change-1', state }),
    ]);
    expect(response.authorizationStates?.[0].customerID).toBeUndefined();
  });

  it('keeps handling payments as before', async () => {
    const response = await webhook({
      transaction: transaction({
        referenceId: 'payment-1',
        status: 'confirmed',
      }),
    });

    expect(response.authorizationStates).toBeUndefined();
    expect(response.paymentStates).toEqual([
      expect.objectContaining({ paymentID: 'payment-1', state: 'paid' }),
    ]);
  });

  it('checks the authorization through the gateway', async () => {
    gatewayClient.getGateway.mockResolvedValue({
      id: 42,
      status: 'waiting',
      referenceId: 'pmc_change-1',
      invoices: [{ transactions: [transaction()] }],
    } as Partial<Gateway>);

    const state = await payrexx.checkAuthorizationStatus({
      intentID: '42',
      changeID: 'change-1',
    });

    expect(gatewayClient.getGateway).toHaveBeenCalledWith('42');
    expect(state).toEqual(
      expect.objectContaining({
        changeID: 'change-1',
        state: 'authorized',
        customerID: '4711',
      })
    );
  });

  it('reports a gateway nobody paid yet as processing', async () => {
    gatewayClient.getGateway.mockResolvedValue({
      id: 42,
      status: 'waiting',
      referenceId: 'pmc_change-1',
      invoices: [],
    } as Partial<Gateway>);

    const state = await payrexx.checkAuthorizationStatus({
      intentID: '42',
      changeID: 'change-1',
    });

    expect(state).toEqual(
      expect.objectContaining({ state: 'processing', customerID: undefined })
    );
  });

  it('keeps the authorized transaction on release, as it is the token', async () => {
    await payrexx.releaseAuthorization({ intentID: '42' });

    expect(
      transactionClient.chargePreAuthorizedTransaction
    ).not.toHaveBeenCalled();
  });
});
