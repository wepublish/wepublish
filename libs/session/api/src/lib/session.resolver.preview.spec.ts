import { SessionResolver } from './session.resolver';

describe('SessionResolver.createJWTForWebsiteLogin', () => {
  const sessionService = {
    createJWTForWebsiteLogin: vi.fn().mockResolvedValue({ token: 'preview' }),
  };
  const impersonationService = {
    continueOnWebsite: vi.fn().mockResolvedValue({ token: 'grant' }),
  };
  const resolver = new SessionResolver(
    sessionService as never,
    impersonationService as never
  );

  beforeEach(() => vi.clearAllMocks());

  it('opens the preview as the user in an ordinary session', async () => {
    await expect(
      resolver.createJWTForWebsiteLogin({
        type: 'user',
        impersonatedBy: null,
        user: { id: 'user-1' },
      } as never)
    ).resolves.toEqual({ token: 'preview' });
    expect(sessionService.createJWTForWebsiteLogin).toHaveBeenCalledWith(
      'user-1'
    );
  });

  it('keeps an impersonation an impersonation on the website', async () => {
    const session = {
      type: 'user',
      impersonatedBy: 'jane@wepublish.ch',
      user: { id: 'user-2' },
    };

    await expect(
      resolver.createJWTForWebsiteLogin(session as never)
    ).resolves.toEqual({ token: 'grant' });
    expect(impersonationService.continueOnWebsite).toHaveBeenCalledWith(
      session
    );
    expect(sessionService.createJWTForWebsiteLogin).not.toHaveBeenCalled();
  });
});
