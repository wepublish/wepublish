import { PaymentState } from '@prisma/client';
import { Request, Response } from 'express';
import { InvoicePaidNotifier } from './invoice-paid.listener';
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
    webhookForPaymentIntent: jest.fn().mockResolvedValue({
      status: 200,
      paymentStates: [{ paymentID: 'payment-1', state: paymentState }],
    }),
    updatePaymentWithIntentState: jest
      .fn()
      .mockResolvedValue(updatePaymentWithIntentStateResult),
  } as unknown as PaymentProvider;
}

function fakeResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.type = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
}

function fakeRequest(): Request {
  return { get: jest.fn() } as unknown as Request;
}

describe('PaymentWebhookController.receiveWebhook', () => {
  it('notifies the invoice paid listener with the payment invoiceID when the intent is paid', async () => {
    const provider = fakeProvider('stripe', PaymentState.paid, {
      id: 'payment-1',
      invoiceID: 'invoice-1',
    });
    const notifier = { notify: jest.fn().mockResolvedValue(undefined) };
    const config = { paymentProviders: [provider] } as PaymentMethodConfig;
    const controller = new PaymentWebhookController(
      config,
      notifier as unknown as InvoicePaidNotifier
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
    const notifier = { notify: jest.fn().mockResolvedValue(undefined) };
    const config = { paymentProviders: [provider] } as PaymentMethodConfig;
    const controller = new PaymentWebhookController(
      config,
      notifier as unknown as InvoicePaidNotifier
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
    const notifier = { notify: jest.fn().mockResolvedValue(undefined) };
    const config = { paymentProviders: [provider] } as PaymentMethodConfig;
    const controller = new PaymentWebhookController(
      config,
      notifier as unknown as InvoicePaidNotifier
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
    (provider.webhookForPaymentIntent as jest.Mock).mockResolvedValue({
      status: 200,
      paymentStates: [{ paymentID: 'payment-1', state: PaymentState.paid }],
      redirectUrl: 'https://example.com/success',
    });
    const notifier = { notify: jest.fn().mockResolvedValue(undefined) };
    const controller = new PaymentWebhookController(
      { paymentProviders: [provider] } as PaymentMethodConfig,
      notifier as unknown as InvoicePaidNotifier
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
    (provider.webhookForPaymentIntent as jest.Mock).mockResolvedValue({
      status: 200,
      html: '<html>checkout</html>',
    });
    const controller = new PaymentWebhookController(
      { paymentProviders: [provider] } as PaymentMethodConfig,
      { notify: jest.fn() } as unknown as InvoicePaidNotifier
    );
    const res = fakeResponse();

    await controller.receiveWebhook('simulated', fakeRequest(), res);

    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('<html>checkout</html>');
  });
});
