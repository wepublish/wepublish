import { ForbiddenException } from '@nestjs/common';
import { AuthSessionType } from '@wepublish/authentication/api';
import { LoginCodeSecondFactor } from '@wepublish/login-code/api';
import {
  EMAIL_VERIFICATION_REQUIRED,
  ProfileResolver,
} from './profile.resolver';

const createResolver = (secondFactor: LoginCodeSecondFactor) => {
  const userService = {
    requestEmailChange: vi.fn().mockResolvedValue(undefined),
    requestEmailVerification: vi.fn().mockResolvedValue(undefined),
    confirmEmailChange: vi.fn().mockResolvedValue({}),
  };
  const secondFactorService = {
    getFactor: vi.fn().mockResolvedValue(secondFactor),
    assert: vi.fn().mockResolvedValue(undefined),
  };
  const resolver = new ProfileResolver(
    userService as never,
    {} as never,
    secondFactorService as never,
    { revokeUserSessions: vi.fn() } as never
  );

  return { resolver, userService, secondFactorService };
};

const session = ({
  restricted,
  placeholderEmail,
}: {
  restricted: boolean;
  placeholderEmail: boolean;
}) =>
  ({
    type: AuthSessionType.User,
    id: 'session-1',
    origin: 'purl',
    restricted,
    placeholderEmail,
    user: { id: 'user-1', email: 'old@example.com' },
  }) as never;

describe('ProfileResolver requestEmailChange', () => {
  // The address on file may look fine and still be dead, so a session from a
  // personal login code may replace it by proving it holds the letter.
  it('lets a login-code session replace a real address with the second factor', async () => {
    const { resolver, userService, secondFactorService } = createResolver(
      LoginCodeSecondFactor.postalCode
    );

    await resolver.requestEmailChange(
      'new@example.com',
      session({ restricted: true, placeholderEmail: false }),
      '8000'
    );

    expect(secondFactorService.assert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      '8000'
    );
    expect(userService.requestEmailChange).toHaveBeenCalledWith(
      'user-1',
      'new@example.com',
      'session-1'
    );
  });

  it('keeps a real address when no second factor guards it', async () => {
    const { resolver, userService } = createResolver(
      LoginCodeSecondFactor.none
    );

    await expect(
      resolver.requestEmailChange(
        'new@example.com',
        session({ restricted: true, placeholderEmail: false })
      )
    ).rejects.toThrow(new ForbiddenException(EMAIL_VERIFICATION_REQUIRED));
    expect(userService.requestEmailChange).not.toHaveBeenCalled();
  });

  it('lets a placeholder address be replaced even without a second factor', async () => {
    const { resolver, userService } = createResolver(
      LoginCodeSecondFactor.none
    );

    await resolver.requestEmailChange(
      'new@example.com',
      session({ restricted: true, placeholderEmail: true })
    );

    expect(userService.requestEmailChange).toHaveBeenCalled();
  });

  it('asks a normal session for nothing extra', async () => {
    const { resolver, userService, secondFactorService } = createResolver(
      LoginCodeSecondFactor.postalCode
    );

    await resolver.requestEmailChange(
      'new@example.com',
      session({ restricted: false, placeholderEmail: false })
    );

    expect(secondFactorService.assert).not.toHaveBeenCalled();
    expect(userService.requestEmailChange).toHaveBeenCalled();
  });
});

// Only the session that asked may be freed by the confirmation, so every
// request and every confirmation says which session it comes from.
describe('ProfileResolver email confirmation and its session', () => {
  it('asks to verify the address on file for the calling session', async () => {
    const { resolver, userService } = createResolver(
      LoginCodeSecondFactor.none
    );

    await resolver.requestEmailVerification(
      session({ restricted: true, placeholderEmail: false })
    );

    expect(userService.requestEmailVerification).toHaveBeenCalledWith(
      'user-1',
      'session-1'
    );
  });

  it('confirms with the session that opened the link', async () => {
    const { resolver, userService } = createResolver(
      LoginCodeSecondFactor.none
    );

    await resolver.confirmEmailChange(
      'token',
      session({ restricted: true, placeholderEmail: false })
    );

    expect(userService.confirmEmailChange).toHaveBeenCalledWith('token', {
      session: { id: 'session-1', userId: 'user-1', origin: 'purl' },
    });
  });

  it('confirms without a session when nobody is signed in', async () => {
    const { resolver, userService } = createResolver(
      LoginCodeSecondFactor.none
    );

    await resolver.confirmEmailChange('token', undefined);

    expect(userService.confirmEmailChange).toHaveBeenCalledWith('token', {
      session: undefined,
    });
  });
});
