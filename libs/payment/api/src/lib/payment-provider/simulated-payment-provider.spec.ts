import { Currency, PaymentState, PrismaClient } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import express from 'express';
import { InvoiceWithItems } from './payment-provider';
import { SimulatedPaymentProvider } from './simulated-payment-provider';
import type { Mock } from 'vitest';

describe('SimulatedPaymentProvider', () => {
  const env = process.env;
  let provider: SimulatedPaymentProvider;
  let kv: ReturnType<typeof createKvMock>;
  let findUnique: Mock;

  const invoice = {
    currency: Currency.CHF,
    items: [
      { amount: 1500, quantity: 2 },
      { amount: 500, quantity: 1 },
    ],
  } as unknown as InvoiceWithItems;

  const setConfig = (offSessionPayments: boolean, declineRenewals = false) =>
    kv.setNs('settings:paymentprovider', 'simulated', {
      id: 'simulated',
      type: 'simulated',
      name: 'Simulated',
      offSessionPayments,
      simulated_declineRenewals: declineRenewals,
    });

  beforeEach(async () => {
    process.env = { ...env, HOST_URL: 'https://api.example.com' };
    kv = createKvMock();
    await setConfig(false);
    findUnique = vi
      .fn()
      .mockResolvedValue({ id: 'payment-1', invoiceID: 'invoice-1' });

    provider = new SimulatedPaymentProvider({
      id: 'simulated',
      prisma: {
        payment: { findUnique },
        invoice: { findUnique: vi.fn().mockResolvedValue(invoice) },
      } as unknown as PrismaClient,
      kv,
    });
  });

  afterEach(() => {
    process.env = env;
  });

  const request = (
    method: 'GET' | 'POST',
    query: Record<string, string>,
    body: Record<string, string> = {}
  ) =>
    provider.webhookForPaymentIntent({
      req: { method, query, body } as unknown as express.Request,
    });

  describe('createIntent', () => {
    it('sends the customer to the simulated checkout page', async () => {
      const intent = await provider.createIntent({
        paymentID: 'payment-1',
        invoice,
        currency: Currency.CHF,
        saveCustomer: false,
        successURL: 'https://site.example.com/success',
        failureURL: 'https://site.example.com/failure',
      });

      expect(intent.state).toBe(PaymentState.processing);
      expect(intent.intentID).toBe('simulated_payment-1');

      const url = new URL(intent.intentSecret);
      expect(`${url.origin}${url.pathname}`).toBe(
        'https://api.example.com/payment-webhooks/simulated'
      );
      expect(url.searchParams.get('paymentID')).toBe('payment-1');
      expect(url.searchParams.get('successURL')).toBe(
        'https://site.example.com/success'
      );
      expect(url.searchParams.get('failureURL')).toBe(
        'https://site.example.com/failure'
      );
    });

    it('charges a stored customer straight away, as a renewal would', async () => {
      const intent = await provider.createIntent({
        paymentID: 'payment-2',
        invoice,
        currency: Currency.CHF,
        saveCustomer: false,
        customerID: 'simulated_payment-1',
        backgroundTask: true,
      });

      expect(intent.state).toBe(PaymentState.paid);
      expect(intent.paidAt).toBeInstanceOf(Date);
      expect(intent.intentSecret).toBe('');
    });

    it('declines a renewal when the provider is set to decline renewals', async () => {
      await setConfig(true, true);

      const intent = await provider.createIntent({
        paymentID: 'payment-2',
        invoice,
        currency: Currency.CHF,
        saveCustomer: false,
        customerID: 'simulated_payment-1',
        backgroundTask: true,
      });

      expect(intent.state).toBe(PaymentState.declined);
      expect(intent.paidAt).toBeUndefined();
      expect(intent.errorCode).toBe('simulated_declined');
    });

    it('still offers the checkout page when renewals are declined', async () => {
      await setConfig(true, true);

      const intent = await provider.createIntent({
        paymentID: 'payment-3',
        invoice,
        currency: Currency.CHF,
        saveCustomer: false,
        successURL: 'https://site.example.com/success',
      });

      expect(intent.state).toBe(PaymentState.processing);
      expect(intent.intentSecret).toContain('/payment-webhooks/simulated');
    });
  });

  describe('checkout page', () => {
    it('shows the amount and a button for every outcome', async () => {
      const response = await request('GET', { paymentID: 'payment-1' });

      expect(response.status).toBe(200);
      expect(response.html).toContain('35.00 CHF');
      for (const action of ['paid', 'declined', 'canceled']) {
        expect(response.html).toContain(`value="${action}"`);
      }
      expect(findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-1' } })
      );
    });

    it('escapes what it echoes back', async () => {
      const response = await request('GET', {
        paymentID: 'payment-1',
        successURL: '"><script>alert(1)</script>',
      });

      expect(response.html).not.toContain('<script>alert(1)</script>');
    });

    it('reports an unknown payment', async () => {
      findUnique.mockResolvedValue(null);

      const response = await request('GET', { paymentID: 'missing' });

      expect(response.status).toBe(404);
    });
  });

  describe('outcome', () => {
    const outcome = (action: string) =>
      request(
        'POST',
        {},
        {
          paymentID: 'payment-1',
          action,
          successURL: 'https://site.example.com/success',
          failureURL: 'https://site.example.com/failure',
        }
      );

    it('pays and returns to the success page', async () => {
      const response = await outcome('paid');

      expect(response.paymentStates).toEqual([
        expect.objectContaining({
          paymentID: 'payment-1',
          state: PaymentState.paid,
          paidAt: expect.any(Date),
        }),
      ]);
      expect(response.paymentStates?.[0].customerID).toBeUndefined();
      expect(response.redirectUrl).toBe('https://site.example.com/success');
    });

    it('stores the customer for renewals when the provider charges off session', async () => {
      await setConfig(true);

      const response = await outcome('paid');

      expect(response.paymentStates?.[0].customerID).toBe(
        'simulated_payment-1'
      );
    });

    it.each([
      ['declined', PaymentState.declined],
      ['canceled', PaymentState.canceled],
    ])(
      'marks the payment %s and returns to the failure page',
      async (action, state) => {
        const response = await outcome(action);

        expect(response.paymentStates).toEqual([
          expect.objectContaining({ paymentID: 'payment-1', state }),
        ]);
        expect(response.redirectUrl).toBe('https://site.example.com/failure');
      }
    );

    it('rejects an unknown outcome', async () => {
      const response = await outcome('refunded');

      expect(response.status).toBe(400);
      expect(response.paymentStates).toBeUndefined();
    });
  });
});
