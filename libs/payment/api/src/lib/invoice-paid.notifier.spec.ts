import {
  InvoicePaidListener,
  InvoicePaidNotifier,
} from './invoice-paid.listener';

describe('InvoicePaidNotifier', () => {
  it('forwards the invoice id to the listener', async () => {
    const listener: InvoicePaidListener = {
      onInvoicePaid: vi.fn().mockResolvedValue(undefined),
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
      onInvoicePaid: vi.fn().mockRejectedValue(new Error('template missing')),
    };

    await expect(
      new InvoicePaidNotifier(listener).notify('invoice-1')
    ).resolves.toBeUndefined();
  });

  it('also forwards the invoice id to registered listeners', async () => {
    const listener: InvoicePaidListener = {
      onInvoicePaid: vi.fn().mockResolvedValue(undefined),
    };
    const registered: InvoicePaidListener = {
      onInvoicePaid: vi.fn().mockResolvedValue(undefined),
    };
    const notifier = new InvoicePaidNotifier(listener);

    notifier.register(registered);
    await notifier.notify('invoice-1');

    expect(listener.onInvoicePaid).toHaveBeenCalledWith('invoice-1');
    expect(registered.onInvoicePaid).toHaveBeenCalledWith('invoice-1');
  });

  it('still notifies the other listeners when one fails', async () => {
    const failing: InvoicePaidListener = {
      onInvoicePaid: vi.fn().mockRejectedValue(new Error('template missing')),
    };
    const registered: InvoicePaidListener = {
      onInvoicePaid: vi.fn().mockResolvedValue(undefined),
    };
    const notifier = new InvoicePaidNotifier(failing);

    notifier.register(registered);
    await notifier.notify('invoice-1');

    expect(registered.onInvoicePaid).toHaveBeenCalledWith('invoice-1');
  });
});
