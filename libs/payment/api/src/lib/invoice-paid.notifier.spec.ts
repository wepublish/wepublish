import {
  InvoicePaidListener,
  InvoicePaidNotifier,
} from './invoice-paid.listener';

describe('InvoicePaidNotifier', () => {
  it('forwards the invoice id to the listener', async () => {
    const listener: InvoicePaidListener = {
      onInvoicePaid: jest.fn().mockResolvedValue(undefined),
    };

    await new InvoicePaidNotifier(listener).notify('invoice-1');

    expect(listener.onInvoicePaid).toHaveBeenCalledWith('invoice-1');
  });

  it('resolves when no listener is registered', async () => {
    await expect(
      new InvoicePaidNotifier(undefined).notify('invoice-1')
    ).resolves.toBeUndefined();
  });

  it('swallows a failing listener so the payment path is unaffected', async () => {
    const listener: InvoicePaidListener = {
      onInvoicePaid: jest.fn().mockRejectedValue(new Error('template missing')),
    };

    await expect(
      new InvoicePaidNotifier(listener).notify('invoice-1')
    ).resolves.toBeUndefined();
  });
});
