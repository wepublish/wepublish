import {
  PaymentAuthorizationListener,
  PaymentAuthorizationNotifier,
} from './payment-authorization.notifier';

describe('PaymentAuthorizationNotifier', () => {
  const state = { changeID: 'change-1', state: 'authorized' as const };

  it('forwards the authorization to every registered listener', async () => {
    const first: PaymentAuthorizationListener = {
      onAuthorization: vi.fn().mockResolvedValue(undefined),
    };
    const second: PaymentAuthorizationListener = {
      onAuthorization: vi.fn().mockResolvedValue(undefined),
    };
    const notifier = new PaymentAuthorizationNotifier();

    notifier.register(first);
    notifier.register(second);
    await notifier.notify('stripe', state);

    expect(first.onAuthorization).toHaveBeenCalledWith('stripe', state);
    expect(second.onAuthorization).toHaveBeenCalledWith('stripe', state);
  });

  it('resolves when no listener is registered', async () => {
    await expect(
      new PaymentAuthorizationNotifier().notify('stripe', state)
    ).resolves.toBeUndefined();
  });

  it('lets a failure through so the provider retries the webhook', async () => {
    const notifier = new PaymentAuthorizationNotifier();
    notifier.register({
      onAuthorization: vi.fn().mockRejectedValue(new Error('db down')),
    });

    await expect(notifier.notify('stripe', state)).rejects.toThrow('db down');
  });
});
