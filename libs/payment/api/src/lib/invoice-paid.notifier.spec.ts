import { Logger } from '@nestjs/common';
import {
  InvoicePaidListener,
  InvoicePaidNotifier,
} from './invoice-paid.listener';

const listener = (
  impl: (invoiceId: string) => Promise<void> = () => Promise.resolve()
): InvoicePaidListener & { onInvoicePaid: ReturnType<typeof vi.fn> } => ({
  onInvoicePaid: vi.fn(impl),
});

describe('InvoicePaidNotifier', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls every registered listener in registration order', async () => {
    const calls: string[] = [];
    const first = listener(async id => {
      calls.push(`first:${id}`);
    });
    const second = listener(async id => {
      calls.push(`second:${id}`);
    });
    const notifier = new InvoicePaidNotifier();

    notifier.register(first);
    notifier.register(second);
    await notifier.notify('invoice-1');

    expect(calls).toEqual(['first:invoice-1', 'second:invoice-1']);
  });

  it('waits for a listener before calling the next one', async () => {
    const calls: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const first = listener(async () => {
      await gate;
      calls.push('first');
    });
    const second = listener(async () => {
      calls.push('second');
    });
    const notifier = new InvoicePaidNotifier();
    notifier.register(first);
    notifier.register(second);

    const done = notifier.notify('invoice-1');
    await Promise.resolve();
    expect(second.onInvoicePaid).not.toHaveBeenCalled();
    release();
    await done;

    expect(calls).toEqual(['first', 'second']);
  });

  it('logs a failing listener and still calls the next one', async () => {
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const failing = listener(() =>
      Promise.reject(new Error('template missing'))
    );
    const next = listener();
    const notifier = new InvoicePaidNotifier();
    notifier.register(failing);
    notifier.register(next);

    await expect(notifier.notify('invoice-1')).resolves.toBeUndefined();

    expect(next.onInvoicePaid).toHaveBeenCalledWith('invoice-1');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('invoice-1'));
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('template missing')
    );
  });

  it('ignores a listener that is registered twice', async () => {
    const once = listener();
    const notifier = new InvoicePaidNotifier();

    notifier.register(once);
    notifier.register(once);
    await notifier.notify('invoice-1');

    expect(once.onInvoicePaid).toHaveBeenCalledTimes(1);
  });

  it('resolves when no listener is registered', async () => {
    await expect(
      new InvoicePaidNotifier().notify('invoice-1')
    ).resolves.toBeUndefined();
  });
});
