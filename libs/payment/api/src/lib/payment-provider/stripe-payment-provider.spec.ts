import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import bodyParser from 'body-parser';
import { CreatePaymentIntentProps } from './payment-provider';
import { StripePaymentProvider } from './stripe-payment-provider';

const createIntentProps: CreatePaymentIntentProps = {
  paymentID: '1',
  invoice: {
    createdAt: new Date(),
    description: 'Subscription',
    dueAt: new Date(),
    id: '22',
    mail: 'dev@wepublish.ch',
    modifiedAt: new Date(),
    items: [],
    paidAt: null,
    canceledAt: null,
    scheduledDeactivationAt: new Date(),
    manuallySetAsPaidByUserId: null,
    renewalSuccessMailSentAt: null,
    suppressRenewalSuccessMail: false,
    currency: 'CHF',
    subscriptionID: '1',
  },
  currency: 'CHF',
  saveCustomer: false,
  successURL: 'http://success-url.wepublish.ch',
  failureURL: 'http://failure-url.wepublish.ch',
};

describe('StripePaymentProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs the stripe error fields when creating the intent fails', async () => {
    const provider = new StripePaymentProvider({
      id: 'stripe',
      incomingRequestHandler: bodyParser.raw({ type: 'application/json' }),
      prisma: {} as PrismaClient,
      kv: {
        getOrLoadNs: vi.fn().mockResolvedValue({
          name: 'Stripe',
          apiKey: 'secret',
          stripe_methods: ['CARD'],
        }),
      } as unknown as KvTtlCacheService,
    });
    const error = Object.assign(new Error('No such customer'), {
      type: 'StripeInvalidRequestError',
      code: 'resource_missing',
      decline_code: 'do_not_honor',
      statusCode: 400,
      requestId: 'req_123',
    });

    vi.spyOn(provider, 'getStripeGateway').mockResolvedValue({
      paymentIntents: { create: vi.fn().mockRejectedValue(error) },
    } as never);
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await provider.createIntent(createIntentProps);

    expect(logged).toHaveBeenCalledWith(
      'Error while creating Stripe Intent for paymentProvider stripe: Error: No such customer (type=StripeInvalidRequestError code=resource_missing decline_code=do_not_honor status=400 requestId=req_123)',
      error.stack
    );
  });
});
