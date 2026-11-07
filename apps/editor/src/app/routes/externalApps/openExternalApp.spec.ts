import { openExternalApp } from './openExternalApp';

const popup = () => ({
  opener: {} as unknown,
  close: vi.fn(),
  location: { replace: vi.fn() },
});

describe('openExternalApp', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens the tab before the token exists and navigates it with the token in the fragment', async () => {
    const tab = popup();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    let resolveToken!: (token: string) => void;
    const mintToken = vi.fn(
      () => new Promise<string>(resolve => (resolveToken = resolve))
    );

    const opened = openExternalApp('https://tool.example.com/', mintToken);

    // the tab is opened inside the click, which is what popup blockers look at
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(tab.location.replace).not.toHaveBeenCalled();

    resolveToken('jwt.a.b');
    await opened;

    expect(tab.opener).toBeNull();
    expect(tab.location.replace).toHaveBeenCalledWith(
      'https://tool.example.com/#token=jwt.a.b'
    );
  });

  it('closes the tab and rethrows when no token can be minted', async () => {
    const tab = popup();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);

    await expect(
      openExternalApp('https://tool.example.com/', () =>
        Promise.reject(new Error('boom'))
      )
    ).rejects.toThrow('boom');

    expect(tab.close).toHaveBeenCalled();
    expect(tab.location.replace).not.toHaveBeenCalled();
  });

  it('does nothing when the browser blocked the popup', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const mintToken = vi.fn();

    await openExternalApp('https://tool.example.com/', mintToken);

    expect(mintToken).not.toHaveBeenCalled();
  });
});
