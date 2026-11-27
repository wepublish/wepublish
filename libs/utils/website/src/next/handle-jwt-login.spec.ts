import { handleJwtLogin } from './handle-jwt-login';

const context = (query: Record<string, string>) => {
  const res = { headersSent: false, writeHead: vi.fn(), end: vi.fn() };

  return {
    ctx: { query, asPath: '/profile', req: {}, res } as never,
    res,
  };
};

describe('handleJwtLogin', () => {
  // Mails sent before the confirmation moved to /confirm-email link to the
  // profile with `?jwt=…&confirmEmailChange=…`. The token they carry no longer
  // logs anyone in: it confirms the address, on the page made for it.
  it('passes a confirmation link of the old kind on to /confirm-email', async () => {
    const mutate = vi.fn();
    const { ctx, res } = context({
      jwt: 'confirm token',
      confirmEmailChange: 'new@example.com',
    });

    expect(await handleJwtLogin(ctx, { mutate } as never)).toBe(false);

    expect(res.writeHead).toHaveBeenCalledWith(302, {
      Location: '/confirm-email?token=confirm%20token',
    });
    expect(res.end).toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('still logs in with a login link', async () => {
    const mutate = vi.fn().mockResolvedValue({
      data: {
        createSessionWithJWT: {
          token: 'session',
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2030-01-01T00:00:00.000Z',
        },
      },
    });
    const { ctx } = context({ jwt: 'login-jwt' });
    Object.assign((ctx as any).res, {
      getHeader: vi.fn(),
      setHeader: vi.fn(),
    });

    expect(await handleJwtLogin(ctx, { mutate } as never)).toBe(true);
    expect(mutate).toHaveBeenCalled();
  });

  it('does nothing without a token', async () => {
    const mutate = vi.fn();
    const { ctx, res } = context({ confirmEmailChange: 'new@example.com' });

    expect(await handleJwtLogin(ctx, { mutate } as never)).toBe(false);
    expect(res.writeHead).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });
});
