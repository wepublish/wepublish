import { initOneSignal } from './one-signal';

const sdk = ({
  supported = true,
  init = vi.fn().mockResolvedValue(undefined),
}: {
  supported?: boolean;
  init?: ReturnType<typeof vi.fn>;
} = {}) => {
  const OneSignal = {
    Notifications: { isPushSupported: vi.fn(() => supported) },
    init,
  };

  return {
    OneSignal,
    load: vi.fn(async () => ({ default: OneSignal }) as never),
  };
};

describe('initOneSignal', () => {
  it('initialises OneSignal with the mannschaft app id', async () => {
    const { OneSignal, load } = sdk();

    await initOneSignal(load);

    expect(OneSignal.init).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: '71c06630-2d7c-487d-b261-e718bb8ef25f',
      })
    );
  });

  it('skips init on a browser without web push', async () => {
    const { OneSignal, load } = sdk({ supported: false });

    await initOneSignal(load);

    expect(OneSignal.init).not.toHaveBeenCalled();
  });

  it('resolves when the OneSignal script is blocked', async () => {
    const { load } = sdk({
      init: vi
        .fn()
        .mockRejectedValue(new Error('OneSignal script failed to load.')),
    });

    await expect(initOneSignal(load)).resolves.toBeUndefined();
  });

  it('resolves when the SDK chunk cannot be loaded', async () => {
    const load = vi.fn(async () => {
      throw new TypeError('Failed to fetch dynamically imported module');
    });

    await expect(initOneSignal(load)).resolves.toBeUndefined();
  });
});
