import type { Mock } from 'vitest';
import { PaymentState } from '@prisma/client';
import { Request, Response } from 'express';
import { InvoicePaidNotifier } from './invoice-paid.listener';
import { PaymentAuthorizationNotifier } from './payment-authorization.notifier';
import { PaymentMethodConfig } from './payment-method/payment-method.config';
import { PaymentProvider } from './payment-provider/payment-provider';
import { PaymentWebhookController } from './payment.webhook';

function fakeProvider(
  id: string,
  paymentState: PaymentState,
  updatePaymentWithIntentStateResult: unknown
): PaymentProvider {
  return {
    id,
    webhookForPaymentIntent: vi.fn().mockResolvedValue({
      status: 200,
      paymentStates: [{ paymentID: 'payment-1', state: paymentState }],
    }),
    updatePaymentWithIntentState: vi
      .fn()
      .mockResolvedValue(updatePaymentWithIntentStateResult),
  } as unknown as PaymentProvider;
}

function fakeResponse(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.type = vi.fn().mockReturnValue(res);
  res.redirect = vi.fn().mockReturnValue(res);
  return res;
}

function fakeRequest(): Request {
  return { get: vi.fn() } as unknown as Request;
}

describe('PaymentWebhookController.receiveWebhook', () => {
  it('notifies the invoice paid listener with the payment invoiceID when the intent is paid', async () => {
    const provider = fakeProvider('stripe', PaymentState.paid, {
      id: 'payment-1',
      invoiceID: 'invoice-1',
    });
    const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const config = { paymentProviders: [provider] } as PaymentMethodConfig;
    const controller = new PaymentWebhookController(
      config,
      notifier as unknown as InvoicePaidNotifier,
      new PaymentAuthorizationNotifier()
    );
    const res = fakeResponse();

    await controller.receiveWebhook('stripe', fakeRequest(), res);

    expect(notifier.notify).toHaveBeenCalledWith('invoice-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('does not notify when the intent state is not paid', async () => {
    const provider = fakeProvider('stripe', PaymentState.submitted, {
      id: 'payment-1',
      invoiceID: 'invoice-1',
    });
    const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const config = { paymentProviders: [provider] } as PaymentMethodConfig;
    const controller = new PaymentWebhookController(
      config,
      notifier as unknown as InvoicePaidNotifier,
      new PaymentAuthorizationNotifier()
    );
    const res = fakeResponse();

    await controller.receiveWebhook('stripe', fakeRequest(), res);

    expect(notifier.notify).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('answers 200 and does not notify when the provider resolves no payment for a paid intent', async () => {
    const provider = fakeProvider(
      'payrexx-subscription',
      PaymentState.paid,
      undefined
    );
    const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const config = { paymentProviders: [provider] } as PaymentMethodConfig;
    const controller = new PaymentWebhookController(
      config,
      notifier as unknown as InvoicePaidNotifier,
      new PaymentAuthorizationNotifier()
    );
    const res = fakeResponse();

    await expect(
      controller.receiveWebhook('payrexx-subscription', fakeRequest(), res)
    ).resolves.toBeDefined();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it('redirects after applying the payment states when the provider asks for it', async () => {
    const provider = fakeProvider('simulated', PaymentState.paid, {
      id: 'payment-1',
      invoiceID: 'invoice-1',
    });
    (provider.webhookForPaymentIntent as Mock).mockResolvedValue({
      status: 200,
      paymentStates: [{ paymentID: 'payment-1', state: PaymentState.paid }],
      redirectUrl: 'https://example.com/success',
    });
    const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const controller = new PaymentWebhookController(
      { paymentProviders: [provider] } as PaymentMethodConfig,
      notifier as unknown as InvoicePaidNotifier,
      new PaymentAuthorizationNotifier()
    );
    const res = fakeResponse();

    await controller.receiveWebhook('simulated', fakeRequest(), res);

    expect(provider.updatePaymentWithIntentState).toHaveBeenCalled();
    expect(notifier.notify).toHaveBeenCalledWith('invoice-1');
    expect(res.redirect).toHaveBeenCalledWith(
      303,
      'https://example.com/success'
    );
    expect(res.send).not.toHaveBeenCalled();
  });

  it('answers with the html page a provider returns', async () => {
    const provider = fakeProvider('simulated', PaymentState.paid, null);
    (provider.webhookForPaymentIntent as Mock).mockResolvedValue({
      status: 200,
      html: '<html>checkout</html>',
    });
    const controller = new PaymentWebhookController(
      { paymentProviders: [provider] } as PaymentMethodConfig,
      { notify: vi.fn() } as unknown as InvoicePaidNotifier,
      new PaymentAuthorizationNotifier()
    );
    const res = fakeResponse();

    await controller.receiveWebhook('simulated', fakeRequest(), res);

    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('<html>checkout</html>');
  });

  describe('authorization states', () => {
    const authorizingProvider = (response: Record<string, unknown>) =>
      ({
        id: 'stripe',
        webhookForPaymentIntent: vi
          .fn()
          .mockResolvedValue({ status: 200, ...response }),
        updatePaymentWithIntentState: vi.fn(),
      }) as unknown as PaymentProvider;

    it('hands each authorization state to the authorization listeners', async () => {
      const state = {
        changeID: 'change-1',
        state: 'authorized',
        customerID: 'cus_1',
      };
      const provider = authorizingProvider({ authorizationStates: [state] });
      const authorizations = new PaymentAuthorizationNotifier();
      const listener = {
        onAuthorization: vi.fn().mockResolvedValue(undefined),
      };
      authorizations.register(listener);
      const invoicePaid = { notify: vi.fn() };
      const controller = new PaymentWebhookController(
        { paymentProviders: [provider] } as PaymentMethodConfig,
        invoicePaid as unknown as InvoicePaidNotifier,
        authorizations
      );
      const res = fakeResponse();

      await controller.receiveWebhook('stripe', fakeRequest(), res);

      expect(listener.onAuthorization).toHaveBeenCalledWith('stripe', state);
      expect(provider.updatePaymentWithIntentState).not.toHaveBeenCalled();
      expect(invoicePaid.notify).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('redirects after applying the authorization states when the provider asks for it', async () => {
      const provider = authorizingProvider({
        authorizationStates: [{ changeID: 'change-1', state: 'failed' }],
        redirectUrl: 'https://example.com/failure',
      });
      const authorizations = new PaymentAuthorizationNotifier();
      const listener = {
        onAuthorization: vi.fn().mockResolvedValue(undefined),
      };
      authorizations.register(listener);
      const controller = new PaymentWebhookController(
        { paymentProviders: [provider] } as PaymentMethodConfig,
        { notify: vi.fn() } as unknown as InvoicePaidNotifier,
        authorizations
      );
      const res = fakeResponse();

      await controller.receiveWebhook('stripe', fakeRequest(), res);

      expect(listener.onAuthorization).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        303,
        'https://example.com/failure'
      );
    });
  });
});
