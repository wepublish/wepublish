import type { Mock } from 'vitest';
import { Currency, PaymentState, PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import type { NodeRequest } from '@nestjs/platform-node';
import { InvoiceWithItems } from './payment-provider';
import { SimulatedPaymentProvider } from './simulated-payment-provider';

describe('SimulatedPaymentProvider', () => {
  const env = process.env;
  let provider: SimulatedPaymentProvider;
  let testing: NamespacedCacheTesting;
  let findUnique: Mock;
  let findChange: Mock;

  const returnURLs = JSON.stringify({
    successURL: 'https://site.example.com/success',
    failureURL: 'https://site.example.com/failure',
  });

  const payment = {
    id: 'payment-1',
    invoiceID: 'invoice-1',
    state: PaymentState.processing,
    intentData: returnURLs,
    paymentMethod: { paymentProviderID: 'simulated' },
  };

  const change = {
    id: 'change-1',
    state: 'pending',
    intentData: returnURLs,
    paymentMethod: { paymentProviderID: 'simulated' },
  };

  const invoice = {
    currency: Currency.CHF,
    items: [
      { amount: 1500, quantity: 2 },
      { amount: 500, quantity: 1 },
    ],
  } as unknown as InvoiceWithItems;

  const setConfig = (offSessionPayments: boolean, declineRenewals = false) =>
    testing.cache.setNs(
      'settings:paymentprovider',
      'simulated',
      {
        id: 'simulated',
        type: 'simulated',
        name: 'Simulated',
        offSessionPayments,
        simulated_declineRenewals: declineRenewals,
      },
      60
    );

  beforeEach(async () => {
    process.env = { ...env, HOST_URL: 'https://api.example.com' };
    testing = await createNamespacedCacheTesting();
    await setConfig(false);
    findUnique = vi.fn().mockResolvedValue(payment);
    findChange = vi.fn().mockResolvedValue(change);

    provider = new SimulatedPaymentProvider({
      id: 'simulated',
      prisma: {
        payment: { findUnique },
        invoice: { findUnique: vi.fn().mockResolvedValue(invoice) },
        subscriptionPaymentMethodChange: { findUnique: findChange },
      } as unknown as PrismaClient,
      kv: testing.cache,
      resets: testing.resets,
    });
  });

  afterEach(async () => {
    process.env = env;
    await testing.close();
  });

  // Values are `unknown`: express parses `a[]=1` and `a[b]=1` into arrays and
  // objects, so the provider cannot assume strings.
  const request = (
    method: 'GET' | 'POST',
    query: Record<string, unknown>,
    body: Record<string, unknown> = {}
  ) =>
    provider.webhookForPaymentIntent({
      req: { method, query, body } as unknown as NodeRequest,
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
    });

    it('stores the return URLs with the payment instead of in the link', async () => {
      const intent = await provider.createIntent({
        paymentID: 'payment-1',
        invoice,
        currency: Currency.CHF,
        saveCustomer: false,
        successURL: 'https://site.example.com/success',
        failureURL: 'https://site.example.com/failure',
      });

      const url = new URL(intent.intentSecret);
      expect(url.searchParams.has('successURL')).toBe(false);
      expect(url.searchParams.has('failureURL')).toBe(false);
      expect(JSON.parse(intent.intentData ?? '')).toEqual({
        successURL: 'https://site.example.com/success',
        failureURL: 'https://site.example.com/failure',
      });
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
        paymentID: '"><script>alert(1)</script>',
      });

      expect(response.html).not.toContain('<script>alert(1)</script>');
    });

    it('does not echo return URLs from the link', async () => {
      const response = await request('GET', {
        paymentID: 'payment-1',
        successURL: 'https://evil.example.com',
      });

      expect(response.html).not.toContain('evil.example.com');
    });

    it('reports an unknown payment', async () => {
      findUnique.mockResolvedValue(null);

      const response = await request('GET', { paymentID: 'missing' });

      expect(response.status).toBe(404);
    });

    it('does not show the payment of another provider', async () => {
      findUnique.mockResolvedValue({
        ...payment,
        paymentMethod: { paymentProviderID: 'payrexx' },
      });

      const response = await request('GET', { paymentID: 'payment-1' });

      expect(response.status).toBe(404);
      expect(response.html).toBeUndefined();
    });

    it('rejects a payment id that is not a string', async () => {
      const response = await request('GET', { paymentID: ['payment-1'] });

      expect(response.status).toBe(400);
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

    it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
      'rejects the inherited property name %s as an outcome',
      async action => {
        const response = await outcome(action);

        expect(response.status).toBe(400);
        expect(response.paymentStates).toBeUndefined();
      }
    );

    it('returns to the URLs stored with the payment, not the posted ones', async () => {
      const response = await request(
        'POST',
        {},
        {
          paymentID: 'payment-1',
          action: 'paid',
          successURL: 'https://evil.example.com',
          failureURL: 'https://evil.example.com',
        }
      );

      expect(response.redirectUrl).toBe('https://site.example.com/success');
    });

    it('settles without a redirect when no return URL was stored', async () => {
      findUnique.mockResolvedValue({ ...payment, intentData: '' });

      const response = await outcome('paid');

      expect(response.status).toBe(200);
      expect(response.paymentStates).toHaveLength(1);
      expect(response.redirectUrl).toBeUndefined();
    });

    it('refuses to settle the payment of another provider', async () => {
      findUnique.mockResolvedValue({
        ...payment,
        paymentMethod: { paymentProviderID: 'payrexx' },
      });

      const response = await outcome('paid');

      expect(response.status).toBe(404);
      expect(response.paymentStates).toBeUndefined();
    });

    it('refuses an unknown payment', async () => {
      findUnique.mockResolvedValue(null);

      const response = await outcome('paid');

      expect(response.status).toBe(404);
      expect(response.paymentStates).toBeUndefined();
    });

    it.each([
      PaymentState.paid,
      PaymentState.canceled,
      PaymentState.declined,
      PaymentState.chargeback,
    ])('refuses to change a payment that is already %s', async state => {
      findUnique.mockResolvedValue({ ...payment, state });

      const response = await outcome('canceled');

      expect(response.status).toBe(409);
      expect(response.paymentStates).toBeUndefined();
    });

    it('rejects posted fields that are not strings', async () => {
      const response = await request(
        'POST',
        {},
        { paymentID: { not: 'x' }, action: 'paid' }
      );

      expect(response.status).toBe(400);
      expect(findUnique).not.toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    it('supports authorizing a payment method without a charge', () => {
      expect(provider.supportsAuthorization()).toBe(true);
    });

    it('sends the customer to the simulated authorization page', async () => {
      const intent = await provider.createAuthorizationIntent({
        changeID: 'change-1',
        currency: Currency.CHF,
        successURL: 'https://site.example.com/success',
        failureURL: 'https://site.example.com/failure',
      });

      expect(intent.state).toBe('processing');
      expect(intent.intentID).toBe('simulated_authorization_change-1');
      expect(intent.amount).toBe(1);

      const url = new URL(intent.intentSecret);
      expect(`${url.origin}${url.pathname}`).toBe(
        'https://api.example.com/payment-webhooks/simulated'
      );
      expect(url.searchParams.get('changeID')).toBe('change-1');
      expect(url.searchParams.has('successURL')).toBe(false);
      expect(url.searchParams.has('failureURL')).toBe(false);
      expect(JSON.parse(intent.intentData ?? '')).toEqual({
        successURL: 'https://site.example.com/success',
        failureURL: 'https://site.example.com/failure',
      });
    });

    it('shows the held amount and that it is never charged', async () => {
      const response = await request('GET', { changeID: 'change-1' });

      expect(response.status).toBe(200);
      expect(response.html).toContain('0.01');
      expect(response.html).toContain('value="authorized"');
      expect(response.html).toContain('value="failed"');
      expect(response.html).toContain('name="changeID" value="change-1"');
      expect(findChange).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'change-1' } })
      );
    });

    it('does not show a change for another provider', async () => {
      findChange.mockResolvedValue({
        ...change,
        paymentMethod: { paymentProviderID: 'payrexx' },
      });

      const response = await request('GET', { changeID: 'change-1' });

      expect(response.status).toBe(404);
      expect(response.html).toBeUndefined();
    });

    it('rejects a change id that is not a string instead of crashing', async () => {
      const response = await request('GET', { changeID: ['change-1'] });

      expect(response.status).toBe(400);
    });

    const outcome = (action: string) =>
      request(
        'POST',
        {},
        {
          changeID: 'change-1',
          action,
          successURL: 'https://site.example.com/success',
          failureURL: 'https://site.example.com/failure',
        }
      );

    it('authorizes, stores a customer and returns to the success page', async () => {
      const response = await outcome('authorized');

      expect(response.status).toBe(200);
      expect(response.paymentStates).toBeUndefined();
      expect(response.authorizationStates).toEqual([
        {
          changeID: 'change-1',
          state: 'authorized',
          customerID: 'simulated_change-1',
        },
      ]);
      expect(response.redirectUrl).toBe('https://site.example.com/success');
    });

    it('fails and returns to the failure page', async () => {
      const response = await outcome('failed');

      expect(response.authorizationStates).toEqual([
        { changeID: 'change-1', state: 'failed' },
      ]);
      expect(response.redirectUrl).toBe('https://site.example.com/failure');
    });

    it('returns to the URLs stored with the change, not the posted ones', async () => {
      const response = await request(
        'POST',
        {},
        {
          changeID: 'change-1',
          action: 'authorized',
          successURL: 'https://evil.example.com',
        }
      );

      expect(response.redirectUrl).toBe('https://site.example.com/success');
    });

    it('refuses to authorize a change for another provider', async () => {
      findChange.mockResolvedValue({
        ...change,
        paymentMethod: { paymentProviderID: 'payrexx' },
      });

      const response = await outcome('authorized');

      expect(response.status).toBe(404);
      expect(response.authorizationStates).toBeUndefined();
    });

    it('refuses a change that is no longer pending', async () => {
      findChange.mockResolvedValue({ ...change, state: 'completed' });

      const response = await outcome('authorized');

      expect(response.status).toBe(409);
      expect(response.authorizationStates).toBeUndefined();
    });

    it('rejects a change id that is not a string', async () => {
      const response = await request(
        'POST',
        {},
        { changeID: ['change-1'], action: 'authorized' }
      );

      expect(response.status).toBe(400);
      expect(findChange).not.toHaveBeenCalled();
    });

    it('has nothing to release', async () => {
      await expect(
        provider.releaseAuthorization({
          intentID: 'simulated_authorization_change-1',
        })
      ).resolves.toBeUndefined();
    });
  });
});
