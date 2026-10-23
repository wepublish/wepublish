import { UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { EXPIRED_API_TOKEN } from './auth-session';
import { OptionalAuthenticationGuard } from './optional-authentication.guard';

vi.mock('@nestjs/graphql', async () => ({
  ...(await vi.importActual('@nestjs/graphql')),
  GqlExecutionContext: { create: vi.fn() },
}));

const authenticateWith = (error: unknown) =>
  vi
    .spyOn(
      Object.getPrototypeOf(OptionalAuthenticationGuard.prototype),
      'canActivate'
    )
    .mockRejectedValue(error);

describe('OptionalAuthenticationGuard', () => {
  beforeEach(() => {
    vi.mocked(GqlExecutionContext.create).mockReturnValue({
      getContext: () => ({ req: {} }),
    } as any);
  });

  afterEach(() => vi.restoreAllMocks());

  it('lets an unknown token through as an anonymous request', async () => {
    authenticateWith(new UnauthorizedException());

    expect(await new OptionalAuthenticationGuard().canActivate({} as any)).toBe(
      true
    );
  });

  it('stops a request made with an expired api key instead of running it anonymously', async () => {
    const expired = new UnauthorizedException('expired', {
      cause: EXPIRED_API_TOKEN,
    });
    authenticateWith(expired);

    await expect(
      new OptionalAuthenticationGuard().canActivate({} as any)
    ).rejects.toBe(expired);
  });
});
