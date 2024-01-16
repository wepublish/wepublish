import {Gateway, GatewayClient} from '../payrexx/gateway-client'
import {TransactionClient, Transaction} from '../payrexx/transaction-client'
import {PayrexxPaymentProvider} from './payrexx-payment-provider'
import {IntentState, InvoiceWithItems} from './payment-provider'
import express from 'express'
import Mock = jest.Mock
import {PartialDeep} from 'type-fest'

function mockInstance<Type = unknown>(implementation?: PartialDeep<Type>) {
  return new (jest.fn().mockImplementation(() => implementation) as Mock<Type>)() as Type
}

describe('PayrexxPaymentProvider', () => {
  let payrexx: PayrexxPaymentProvider

  beforeEach(() => {
    const gatewayClient = mockInstance<GatewayClient>({
      createGateway: jest.fn(),
      getGateway: jest.fn()
    })
    const transactionClient = mockInstance<TransactionClient>({
      retrieveTransaction: jest.fn(),
      chargePreAuthorizedTransaction: jest.fn()
    })

    payrexx = new PayrexxPaymentProvider({
      id: 'payrexx',
      name: 'Payrexx',
      vatRate: 25,
      gatewayClient,
      transactionClient,
      psp: [14],
      offSessionPayments: true,
      webhookApiKey: 'secret',
      pm: ['foo']
    })
  })

  describe('Webhooks', () => {
    it('should reject unauthorized', async () => {
      const response = await payrexx.webhookForPaymentIntent({
        req: {
          body: {}
        } as unknown as express.Request
      })
      expect(response.status).toEqual(403)
    })

    it('should ignore non-transaction payloads', async () => {
      const response = await payrexx.webhookForPaymentIntent({
        req: {
          query: {apiKey: 'secret'},
          body: {}
        } as unknown as express.Request
      })
      expect(response.status).toEqual(200)
      expect(response.message).toContain('Skipping non-transaction webhook')
      expect(response.paymentStates).toEqual(undefined)
    })

    it('should ignore payload with subscription', async () => {
      const transaction = {
        id: 12345,
        amount: 200,
        status: 'confirmed',
        referenceId: 'subscription-1',
        subscription: {}
      } as Transaction

      const response = await payrexx.webhookForPaymentIntent({
        req: {
          query: {apiKey: 'secret'},
          body: {transaction}
        } as unknown as express.Request
      })
      expect(response.status).toEqual(200)
      expect(response.message).toContain('Skipping transaction related to subscription')
      expect(response.paymentStates).toEqual(undefined)
    })

    it('should process correct payload', async () => {
      const transaction = {
        id: 12345,
        amount: 200,
        status: 'confirmed',
        referenceId: 'subscription-1',
        subscription: null
      } as Transaction

      const response = await payrexx.webhookForPaymentIntent({
        req: {
          query: {apiKey: 'secret'},
          body: {transaction}
        } as unknown as express.Request
      })
      expect(response.status).toEqual(200)
      expect(response.paymentStates).toEqual([
        {
          paymentID: transaction.referenceId,
          paymentData: JSON.stringify(transaction),
          state: 'paid'
        } as IntentState
      ])
    })

    it('should ignore transactions with unknown payment status', async () => {
      const transaction = {
        id: 12345,
        amount: 200,
        status: 'chargeback',
        referenceId: 'subscription-1',
        subscription: null
      } as Transaction

      const response = await payrexx.webhookForPaymentIntent({
        req: {
          query: {apiKey: 'secret'},
          body: {transaction}
        } as unknown as express.Request
      })
      expect(response.status).toEqual(200)
      expect(response.paymentStates).toEqual([])
    })
  })

  describe('Payments', () => {
    it('should create gateway for user without customerId', async () => {
      payrexx.gatewayClient.createGateway = jest.fn().mockResolvedValue({
        id: 1,
        link: 'https://payrexx/gateway-link'
      } as Partial<Gateway>)

      const result = await payrexx.createIntent({
        invoice: {
          items: [
            {
              amount: 120,
              quantity: 3
            }
          ]
        } as unknown as InvoiceWithItems,
        paymentID: '456',
        successURL: 'https://success',
        failureURL: 'https://failure',
        saveCustomer: false
      })

      expect(payrexx.gatewayClient.createGateway).toBeCalled()
      expect(payrexx.transactionClient.chargePreAuthorizedTransaction).not.toBeCalled()
      expect(result.intentID).toBe('1')
      expect(result.intentSecret).toBe('https://payrexx/gateway-link')
    })

    it('should charge transaction for user with customerId', async () => {
      payrexx.transactionClient.chargePreAuthorizedTransaction = jest.fn().mockResolvedValue({
        id: 2,
        status: 'confirmed'
      } as Partial<Transaction>)

      const result = await payrexx.createIntent({
        customerID: '123',
        invoice: {
          items: [
            {
              amount: 120,
              quantity: 3
            }
          ]
        } as unknown as InvoiceWithItems,
        paymentID: '456',
        successURL: 'https://success',
        failureURL: 'https://failure',
        saveCustomer: false
      })

      expect(payrexx.gatewayClient.createGateway).not.toBeCalled()
      expect(payrexx.transactionClient.chargePreAuthorizedTransaction).toBeCalled()
      expect(result.intentID).toBe('2')
      expect(result.intentSecret).toBe('https://success')
    })

    it('should create gateway for user with customer id and unsuccessful transaction', async () => {
      payrexx.transactionClient.chargePreAuthorizedTransaction = jest.fn().mockResolvedValue({
        id: 3,
        status: 'declined'
      } as Partial<Transaction>)

      payrexx.gatewayClient.createGateway = jest.fn().mockResolvedValue({
        id: 4,
        link: 'https://payrexx/gateway-link'
      } as Partial<Gateway>)

      const result = await payrexx.createIntent({
        customerID: '123',
        invoice: {
          items: [
            {
              amount: 120,
              quantity: 3
            }
          ]
        } as unknown as InvoiceWithItems,
        paymentID: '456',
        successURL: 'https://success',
        failureURL: 'https://failure',
        saveCustomer: false
      })

      expect(payrexx.gatewayClient.createGateway).toBeCalled()
      expect(payrexx.transactionClient.chargePreAuthorizedTransaction).toBeCalled()
      expect(result.intentID).toBe('4')
      expect(result.intentSecret).toBe('https://payrexx/gateway-link')
    })
  })
})
