import {GatewayClient} from '../payrexx/gateway-client'
import {TransactionClient, Transaction} from '../payrexx/transaction-client'
import {PayrexxPaymentProvider} from './payrexx-payment-provider'
import {IntentState} from './payment-provider'
import express from 'express'
import Mock = jest.Mock
import {PartialDeep} from 'type-fest'

// Mock GatewayClient and TransactionClient

function mockInstance<Type = unknown>(implementation?: PartialDeep<Type>) {
  return jest.fn().mockImplementation(() => implementation) as Mock<Type> & Type
}

describe('PayrexxPaymentProvider', () => {
  let payrexx: PayrexxPaymentProvider

  beforeEach(() => {
    const gatewayClient = mockInstance<GatewayClient>({
      getGateway: jest.fn().mockReturnValue({})
    })
    const transactionClient = mockInstance<TransactionClient>()

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
})
