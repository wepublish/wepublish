import { Gateway, GatewayClient } from '../payrexx/gateway-client';
import { TransactionClient, Transaction } from '../payrexx/transaction-client';
import { PayrexxPaymentProvider } from './payrexx-payment-provider';
import { IntentState, InvoiceWithItems } from './payment-provider';
import express from 'express';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import Mock = jest.Mock;
import { PartialDeep } from 'type-fest';
import { Currency, Prisma, PrismaClient } from '@prisma/client';
import { PayrexxFactoryProps } from '../payrexx/payrexx-factory';

function mockInstance<Type = unknown>(implementation?: PartialDeep<Type>) {
  return new (jest
    .fn()
    .mockImplementation(() => implementation) as Mock<Type>)() as Type;
}

describe('PayrexxPaymentProvider', () => {
  let payrexx: PayrexxPaymentProvider;
  let gatewayClient: GatewayClient;
  let transactionClient: TransactionClient;

  beforeEach(async () => {
    gatewayClient = mockInstance<GatewayClient>({
      createGateway: jest.fn(),
      getGateway: jest.fn(),
    });
    transactionClient = mockInstance<TransactionClient>({
      retrieveTransaction: jest.fn(),
      chargePreAuthorizedTransaction: jest.fn(),
    });
    class PayrexxFactoryMock {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor(_props: PayrexxFactoryProps) {}

      get gatewayClient(): GatewayClient {
        return gatewayClient;
      }

      get transactionClient(): TransactionClient {
        return transactionClient;
      }
    }

    const mockPrisma = mockInstance<PrismaClient>();
    const kvMock = createKvMock();

    await kvMock.setNs('settings:paymentprovider', 'payrexx', {
      id: 'payrexx',
      type: 'payrexx',
      name: 'Payrexx',
      offSessionPayments: true,
      apiKey: 'key',
      webhookEndpointSecret: 'secret',
      payrexx_instancename: 'instancename',
      payrexx_psp: ['PAYPAL', 'TWINT', 'STRIPE'],
      payrexx_pm: ['PAYPAL', 'TWINT', 'APPLE_PAY'],
      payrexx_vatrate: new Prisma.Decimal('7.7'),
    });

    payrexx = new PayrexxPaymentProvider({
      id: 'payrexx',
      prisma: mockPrisma,
      kv: kvMock,
    });

    payrexx.overridePayrexxFactory(PayrexxFactoryMock as any);
  });

  describe('webhookForPaymentIntent', () => {
    it('should reject unauthorized', async () => {
      const response = await payrexx.webhookForPaymentIntent({
        req: {
          body: {},
          query: {},
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(403);
    });

    it('should reject unauthorized when content-type is not application/json', async () => {
      const response = await payrexx.webhookForPaymentIntent({
        req: {
          query: { apiKey: 'secret' },
          headers: {
            'content-type': 'text/plain',
          },
          body: {},
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(415);
      expect(response.message).toEqual(
        'Request does not contain valid json. Is Payrexx wrongly configured to send a PHP-Post?'
      );
    });

    it('should reject unauthorized when req.body is a string', async () => {
      const response = await payrexx.webhookForPaymentIntent({
        req: {
          query: { apiKey: 'secret' },
          headers: {
            'content-type': 'application/json',
          },
          body: 'invalid-string-body',
        } as unknown as express.Request,
      });

      expect(response.status).toEqual(415);
      expect(response.message).toEqual(
        'Request does not contain valid json. Is Payrexx wrongly configured to send a PHP-Post?'
      );
    });

    it('should ignore non-transaction payloads', async () => {
      const response = await payrexx.webhookForPaymentIntent({
        req: {
          query: { apiKey: 'secret' },
          headers: {
            'content-type': 'application/json',
          },
          body: {},
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(200);
      expect(response.message).toContain('Skipping non-transaction webhook');
      expect(response.paymentStates).toEqual(undefined);
    });

    it('should ignore payload with subscription', async () => {
      const transaction = {
        id: 12345,
        amount: 200,
        status: 'confirmed',
        referenceId: 'subscription-1',
        subscription: {},
      } as Transaction;

      const response = await payrexx.webhookForPaymentIntent({
        req: {
          headers: {
            'content-type': 'application/json',
          },
          query: { apiKey: 'secret' },
          body: { transaction },
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(200);
      expect(response.message).toContain(
        'Skipping transaction related to subscription'
      );
      expect(response.paymentStates).toEqual(undefined);
    });

    it('should process correct payload', async () => {
      const transaction = {
        id: 12345,
        amount: 200,
        status: 'confirmed',
        referenceId: 'subscription-1',
        subscription: null,
      } as Transaction;

      const response = await payrexx.webhookForPaymentIntent({
        req: {
          headers: {
            'content-type': 'application/json',
          },
          query: { apiKey: 'secret' },
          body: { transaction },
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(200);
      expect(response.paymentStates).toEqual([
        {
          paymentID: transaction.referenceId,
          paymentData: JSON.stringify(transaction),
          state: 'paid',
        } as IntentState,
      ]);
    });

    it('should ignore transactions with unknown payment status', async () => {
      const transaction = {
        id: 12345,
        amount: 200,
        status: 'chargeback',
        referenceId: 'subscription-1',
        subscription: null,
      } as Transaction;

      const response = await payrexx.webhookForPaymentIntent({
        req: {
          headers: {
            'content-type': 'application/json',
          },
          query: { apiKey: 'secret' },
          body: { transaction },
        } as unknown as express.Request,
      });
      expect(response.status).toEqual(200);
      expect(response.paymentStates).toEqual([]);
    });
  });

  describe('createIntent', () => {
    it('should create gateway for user without customerId', async () => {
      gatewayClient.createGateway = jest.fn().mockResolvedValue({
        id: 1,
        link: 'https://payrexx/gateway-link',
      } as Partial<Gateway>);

      const result = await payrexx.createIntent({
        invoice: {
          items: [
            {
              amount: 120,
              quantity: 3,
            },
          ],
        } as unknown as InvoiceWithItems,
        paymentID: '456',
        successURL: 'https://success',
        failureURL: 'https://failure',
        currency: Currency.EUR,
        saveCustomer: false,
      });

      expect(gatewayClient.createGateway).toBeCalled();
      expect(transactionClient.chargePreAuthorizedTransaction).not.toBeCalled();
      expect(result.intentID).toBe('1');
      expect(result.intentSecret).toBe('https://payrexx/gateway-link');
    });

    it('should charge transaction for user with customerId', async () => {
      transactionClient.chargePreAuthorizedTransaction = jest
        .fn()
        .mockResolvedValue({
          id: 2,
          status: 'confirmed',
        } as Partial<Transaction>);

      const result = await payrexx.createIntent({
        customerID: '123',
        invoice: {
          items: [
            {
              amount: 120,
              quantity: 3,
            },
          ],
        } as unknown as InvoiceWithItems,
        paymentID: '456',
        successURL: 'https://success',
        failureURL: 'https://failure',
        saveCustomer: false,
        currency: Currency.CHF,
      });

      expect(gatewayClient.createGateway).not.toBeCalled();
      expect(transactionClient.chargePreAuthorizedTransaction).toBeCalled();
      expect(result.intentID).toBe('2');
      expect(result.intentSecret).toBe('https://success');
    });

    it('should create gateway for user with customer id and unsuccessful transaction', async () => {
      transactionClient.chargePreAuthorizedTransaction = jest
        .fn()
        .mockResolvedValue({
          id: 3,
          status: 'declined',
        } as Partial<Transaction>);

      gatewayClient.createGateway = jest.fn().mockResolvedValue({
        id: 4,
        link: 'https://payrexx/gateway-link',
      } as Partial<Gateway>);

      const result = await payrexx.createIntent({
        customerID: '123',
        invoice: {
          items: [
            {
              amount: 120,
              quantity: 3,
            },
          ],
        } as unknown as InvoiceWithItems,
        paymentID: '456',
        successURL: 'https://success',
        failureURL: 'https://failure',
        saveCustomer: false,
        currency: Currency.EUR,
      });

      expect(gatewayClient.createGateway).toBeCalled();
      expect(transactionClient.chargePreAuthorizedTransaction).toBeCalled();
      expect(result.intentID).toBe('4');
      expect(result.intentSecret).toBe('https://payrexx/gateway-link');
    });
  });

  describe('checkIntentStatus', () => {
    it('should throw on unmappable transaction status', async () => {
      const transaction = {
        status: 'chargeback',
      } as Transaction;
      transactionClient.retrieveTransaction = jest
        .fn()
        .mockResolvedValue(transaction);

      await expect(
        payrexx.checkIntentStatus({ intentID: '5', paymentID: '123' })
      ).rejects.toThrow('Unmappable Payrexx transaction status');
    });

    it('should throw on empty transaction referenceId', async () => {
      const transaction = {
        status: 'confirmed',
      } as Transaction;
      transactionClient.retrieveTransaction = jest
        .fn()
        .mockResolvedValue(transaction);

      await expect(
        payrexx.checkIntentStatus({ intentID: '6', paymentID: '123' })
      ).rejects.toThrow('empty referenceId');
    });

    it('should get intent state based on transaction id', async () => {
      const transaction = {
        status: 'confirmed',
        referenceId: '135',
      } as Transaction;
      transactionClient.retrieveTransaction = jest
        .fn()
        .mockResolvedValue(transaction);

      const result = await payrexx.checkIntentStatus({
        intentID: '6',
        paymentID: '123',
      });
      expect(result.paymentID).toBe('135');
      expect(result.state).toBe('paid');
      expect(result.paymentData).toBe(JSON.stringify(transaction));
      expect(transactionClient.retrieveTransaction).toBeCalled();
      expect(gatewayClient.getGateway).not.toBeCalled();
    });

    it('should throw on unmappable gateway status', async () => {
      const gateway = {
        status: 'unknown status' as any,
      } as Gateway;
      transactionClient.retrieveTransaction = jest.fn().mockResolvedValue(null);
      gatewayClient.getGateway = jest.fn().mockResolvedValue(gateway);

      await expect(
        payrexx.checkIntentStatus({ intentID: '6', paymentID: '123' })
      ).rejects.toThrow('Unmappable Payrexx gateway status');
    });

    it('should throw on empty gateway referenceId', async () => {
      const gateway = {
        status: 'waiting',
        invoices: [],
      } as Gateway;
      transactionClient.retrieveTransaction = jest.fn().mockResolvedValue(null);
      gatewayClient.getGateway = jest.fn().mockResolvedValue(gateway);

      await expect(
        payrexx.checkIntentStatus({ intentID: '6', paymentID: '123' })
      ).rejects.toThrow('empty referenceId');
    });

    it('should get intent state based on gateway id', async () => {
      const transaction = {
        status: 'waiting',
      } as Transaction;
      const gateway = {
        status: 'waiting',
        referenceId: '246',
        invoices: [{ transactions: [transaction] }],
      } as Gateway;
      transactionClient.retrieveTransaction = jest.fn().mockResolvedValue(null);
      gatewayClient.getGateway = jest.fn().mockResolvedValue(gateway);

      const result = await payrexx.checkIntentStatus({
        intentID: '6',
        paymentID: '123',
      });
      expect(result.paymentID).toBe('246');
      expect(result.state).toBe('processing');
      expect(result.paymentData).toBe(JSON.stringify(gateway));
      expect(transactionClient.retrieveTransaction).toBeCalled();
      expect(gatewayClient.getGateway).toBeCalled();
    });

    it('should throw if intent is not related to transaction or gateway', async () => {
      transactionClient.retrieveTransaction = jest.fn().mockResolvedValue(null);
      gatewayClient.getGateway = jest.fn().mockResolvedValue(null);
      await expect(
        payrexx.checkIntentStatus({ intentID: '6', paymentID: '123' })
      ).rejects.toThrow('Payrexx Gateway/Transaction not found');
    });
  });
});
