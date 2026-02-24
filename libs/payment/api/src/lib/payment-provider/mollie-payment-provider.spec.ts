import {
  CheckIntentProps,
  CreatePaymentIntentProps,
  IntentState,
} from './payment-provider';
import express from 'express';
import {
  calculateAndFormatAmount,
  mapMollieEventToPaymentStatus,
  MolliePaymentProvider,
} from './mollie-payment-provider';
import bodyParser from 'body-parser';
import { PaymentState } from '@prisma/client';
import { PaymentMethod } from '@mollie/api-client';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { mapMolliePaymentMethods } from '../payment.methode.mapper';
const mollieApiPaymentGet = {
  status: 'paid',
  price: 22,
  metadata: {
    paymentID: '22',
  },
  customerId: '23',
};
const mollieApiCustomerCreate = {
  id: 1,
};
const mollieApiPaymentCreate = {
  id: 1,
  getCheckoutUrl: jest.fn().mockReturnValue('https://mooked.mollie.com/url'),
  status: 'pending',
};
const mollieApiCustomerPaymentCreate = {
  id: 1,
  getCheckoutUrl: jest.fn().mockReturnValue('https://mooked.mollie.com/url'),
  status: 'pending',
};

const defaultCreatePaymentIntentProps: CreatePaymentIntentProps = {
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
    currency: 'EUR',
    subscriptionID: '1',
  },
  currency: 'EUR',
  saveCustomer: true,
  successURL: 'http://success-url.wepublish.ch',
  failureURL: 'http://failure-url.wepublish.ch',
};

jest.mock('@mollie/api-client', () => {
  const originalModule = jest.requireActual('@mollie/api-client');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(() => ({
      // Add any mock functions or properties needed here
      payments: {
        create: jest.fn().mockResolvedValue({
          ...mollieApiPaymentCreate,
          getCheckoutUrl: mollieApiPaymentCreate.getCheckoutUrl,
        }),
        get: jest.fn().mockResolvedValue(mollieApiPaymentGet),
      },
      customers: {
        create: jest.fn().mockResolvedValue(mollieApiCustomerCreate),
      },
      customerPayments: {
        create: jest.fn().mockResolvedValue({
          ...mollieApiCustomerPaymentCreate,
          getCheckoutUrl: mollieApiCustomerPaymentCreate.getCheckoutUrl,
        }),
      },
    })),
  };
});

describe('MolliePaymentProvider', () => {
  let mollieOffSession: MolliePaymentProvider;
  let mollieOnSession: MolliePaymentProvider;

  beforeEach(() => {
    const mockPrisma = {} as PrismaClient;
    const mockKvOffSession = {
      getOrLoadNs: jest.fn().mockResolvedValue({
        name: 'Mollie',
        offSessionPayments: true,
        webhookEndpointSecret: 'secret',
        mollie_apiBaseUrl: 'https://api.wepublish.dev',
        apiKey: 'secret',
        mollie_methods: ['PAYPAL'],
      }),
    } as unknown as KvTtlCacheService;

    const mockKvOnSession = {
      getOrLoadNs: jest.fn().mockResolvedValue({
        name: 'Mollie',
        offSessionPayments: false,
        webhookEndpointSecret: 'secret',
        mollie_apiBaseUrl: 'https://api.wepublish.dev',
        apiKey: 'secret',
        mollie_methods: ['PAYPAL'],
      }),
    } as unknown as KvTtlCacheService;

    mollieOffSession = new MolliePaymentProvider({
      id: 'mollie',
      incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
      prisma: mockPrisma,
      kv: mockKvOffSession,
    });

    mollieOnSession = new MolliePaymentProvider({
      id: 'mollie',
      incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
      prisma: mockPrisma,
      kv: mockKvOnSession,
    });
  });

  describe('webhookForPaymentIntent', () => {
    it('should reject unauthorized', async () => {
      const response = await mollieOffSession.webhookForPaymentIntent({
        req: {
          body: {},
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(403);
    });

    it('should ignore missing id', async () => {
      const response = await mollieOffSession.webhookForPaymentIntent({
        req: {
          query: { key: 'secret' },
          body: {},
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(200);
      expect(response.paymentStates).toEqual([]);
    });

    it('should process correct payload offsession mode', async () => {
      const transaction = { id: 'dd-1' };

      const response = await mollieOffSession.webhookForPaymentIntent({
        req: {
          query: { key: 'secret' },
          body: { id: transaction.id }, // Pass the transaction id as form data
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(200);
      expect(response.paymentStates).toEqual([
        {
          customerID: '23',
          paymentData: JSON.stringify({
            status: 'paid',
            price: 22,
            metadata: { paymentID: '22' },
            customerId: '23',
          }),
          paymentID: '22',
          state: 'paid',
        } as IntentState,
      ]);
    });
    it('should process correct payload onsession mode', async () => {
      const transaction = { id: 'dd-1' };

      const response = await mollieOnSession.webhookForPaymentIntent({
        req: {
          query: { key: 'secret' },
          body: { id: transaction.id }, // Pass the transaction id as form data
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(200);
      expect(response.paymentStates).toEqual([
        {
          customerID: undefined,
          paymentData: JSON.stringify({
            status: 'paid',
            price: 22,
            metadata: { paymentID: '22' },
            customerId: '23',
          }),
          paymentID: '22',
          state: 'paid',
        } as IntentState,
      ]);
    });
  });

  describe('mapMollieEventToPaymentStatus', () => {
    it('states should map correctly', async () => {
      const testStates = [
        {
          input: 'failed',
          result: PaymentState.requiresUserAction,
        },
        {
          input: 'expired',
          result: PaymentState.requiresUserAction,
        },
        {
          input: 'open',
          result: PaymentState.processing,
        },
        {
          input: 'authorized',
          result: PaymentState.processing,
        },
        {
          input: 'pending',
          result: PaymentState.processing,
        },
        {
          input: 'paid',
          result: PaymentState.paid,
        },
        {
          input: 'canceled',
          result: PaymentState.canceled,
        },
      ];

      for (const testState of testStates) {
        expect(mapMollieEventToPaymentStatus(testState.input)).toEqual(
          testState.result
        );
      }
    });
  });

  describe('calculateAndFormatAmount', () => {
    it('amount should be calculated and formated', async () => {
      const invoice = {
        items: [
          {
            amount: 20,
            quantity: 1,
          },
          {
            amount: 100,
            quantity: 1,
          },
        ],
      };
      expect(calculateAndFormatAmount(invoice)).toEqual('1.20');
      expect(
        calculateAndFormatAmount({ items: [{ amount: 20, quantity: 1 }] })
      ).toEqual('0.20');
      expect(
        calculateAndFormatAmount({ items: [{ amount: 9900, quantity: 1 }] })
      ).toEqual('99.00');
      expect(
        calculateAndFormatAmount({ items: [{ amount: 1, quantity: 1 }] })
      ).toEqual('0.01');
    });
  });

  describe('getPaymentMethode', () => {
    it('should parse payment methods', async () => {
      expect(mapMolliePaymentMethods(['PAYPAL', 'CREDITCARD'])).toEqual([
        PaymentMethod.paypal,
        PaymentMethod.creditcard,
      ]);
    });
  });

  describe('generateWebhookUrl', () => {
    it('should generate correct webhook url', async () => {
      expect(await mollieOffSession.generateWebhookUrl()).toEqual(
        'https://api.wepublish.dev/payment-webhooks/mollie?key=secret'
      );
    });
  });

  describe('createIntent', () => {
    it('should return payment url onsession', async () => {
      expect(
        await mollieOnSession.createIntent(defaultCreatePaymentIntentProps)
      ).toEqual({
        intentData: '{"id":1,"status":"pending"}',
        intentID: 1,
        intentSecret: 'https://mooked.mollie.com/url',
        state: 'processing',
      });
    });
    it('should return payment url offsession first payment', async () => {
      expect(
        await mollieOffSession.createIntent(defaultCreatePaymentIntentProps)
      ).toEqual({
        intentData: '{"id":1,"status":"pending"}',
        intentID: 1,
        intentSecret: 'https://mooked.mollie.com/url',
        state: 'processing',
      });
    });
    it('should return payment url offsession secound payment', async () => {
      const modifiedCreatePaymentIntentProps = structuredClone(
        defaultCreatePaymentIntentProps
      );
      modifiedCreatePaymentIntentProps.customerID = '22';
      expect(
        await mollieOffSession.createIntent(modifiedCreatePaymentIntentProps)
      ).toEqual({
        intentData: '{"id":1,"status":"pending"}',
        intentID: 1,
        intentSecret: 'https://mooked.mollie.com/url',
        state: 'processing',
      });
    });
  });

  describe('createGatewayIntent', () => {
    it('should return payment url for offsession', async () => {
      expect(
        await mollieOffSession.createGatewayIntent(
          defaultCreatePaymentIntentProps
        )
      ).toEqual({
        intentData: '{"id":1,"status":"pending"}',
        intentID: 1,
        intentSecret: 'https://mooked.mollie.com/url',
        state: 'processing',
      });
    });
  });

  describe('createOffsiteTransactionIntent', () => {
    it('should return no payment url for valid offsession customer', async () => {
      const props = structuredClone(defaultCreatePaymentIntentProps);
      props.customerID = '22';

      const mockClient = {
        customerPayments: {
          create: jest.fn().mockResolvedValue({
            customerId: '22',
            id: 'test_payment_id',
            status: 'paid',
            getCheckoutUrl: () => '',
          }),
        },
      };

      jest
        .spyOn(mollieOffSession, 'getMollieGateway')
        .mockResolvedValue(mockClient as any);
      expect(
        await mollieOffSession.createOffsiteTransactionIntent(props)
      ).toEqual({
        intentData:
          '{"customerId":"22","id":"test_payment_id","status":"paid"}',
        intentID: 'test_payment_id',
        intentSecret: '',
        state: 'paid',
      });
    });
    it('should invalid intent', async () => {
      // Workaround to make linter happy :-)
      const x = 'tt';
      (
        (await mollieOffSession.getMollieGateway()).customerPayments
          .create as jest.Mock
      ).mockImplementationOnce(() =>
        Promise.resolve({
          customerId: '22',
          id: 'test_payment_id',
          status: 'paid',
          getCheckoutUrl: () => '',
        })
      );
      expect(
        await mollieOffSession.createOffsiteTransactionIntent(
          defaultCreatePaymentIntentProps
        )
      ).toEqual({
        errorCode: 'error',
        intentData: 'error',
        intentID: 'error',
        intentSecret: '',
        state: 'requiresUserAction',
      });
    });
  });

  describe('checkIntentStatus', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('offsession paid payment', async () => {
      const intent: CheckIntentProps = { intentID: '1', paymentID: '1' };

      const mockClient = {
        payments: {
          get: jest.fn().mockResolvedValue({
            id: 'test_payment_id',
            status: 'paid',
            customerId: 'customer_id',
            metadata: { paymentID: '22' },
          }),
        },
      };

      jest
        .spyOn(mollieOffSession, 'getMollieGateway')
        .mockResolvedValue(mockClient as any);

      await expect(mollieOffSession.checkIntentStatus(intent)).resolves.toEqual(
        {
          customerID: 'customer_id',
          paymentData:
            '{"id":"test_payment_id","status":"paid","customerId":"customer_id","metadata":{"paymentID":"22"}}',
          paymentID: '22',
          state: 'paid',
        }
      );
    });

    it('offsession failed payment', async () => {
      const intent: CheckIntentProps = { intentID: '1', paymentID: '1' };

      const mockClient = {
        payments: {
          get: jest.fn().mockResolvedValue({
            id: 'test_payment_id',
            status: 'failed',
            customerId: 'customer_id',
            metadata: { paymentID: '22' },
          }),
        },
      };

      jest
        .spyOn(mollieOffSession, 'getMollieGateway')
        .mockResolvedValue(mockClient as any);

      await expect(mollieOffSession.checkIntentStatus(intent)).resolves.toEqual(
        {
          customerID: 'customer_id',
          paymentData:
            '{"id":"test_payment_id","status":"failed","customerId":"customer_id","metadata":{"paymentID":"22"}}',
          paymentID: '22',
          state: 'requiresUserAction',
        }
      );
    });

    it('onsession paid payment', async () => {
      const intent: CheckIntentProps = { intentID: '1', paymentID: '1' };

      const mockClient = {
        payments: {
          get: jest.fn().mockResolvedValue({
            id: 'test_payment_id',
            status: 'paid',
            metadata: { paymentID: '22' },
          }),
        },
      };

      jest
        .spyOn(mollieOnSession, 'getMollieGateway')
        .mockResolvedValue(mockClient as any);

      await expect(mollieOnSession.checkIntentStatus(intent)).resolves.toEqual({
        customerID: undefined,
        paymentData:
          '{"id":"test_payment_id","status":"paid","metadata":{"paymentID":"22"}}',
        paymentID: '22',
        state: 'paid',
      });
    });

    it('missing paymentID', async () => {
      const intent: CheckIntentProps = { intentID: '1', paymentID: '1' };

      const mockClient = {
        payments: {
          get: jest.fn().mockResolvedValue({
            id: 'test_payment_id',
            status: 'paid',
            metadata: { email: 'admin@wepublish.ch' }, // no paymentID
          }),
        },
      };

      jest
        .spyOn(mollieOffSession, 'getMollieGateway')
        .mockResolvedValue(mockClient as any);

      await expect(mollieOffSession.checkIntentStatus(intent)).rejects.toThrow(
        'empty paymentID'
      );
    });
  });
});
