import { ForbiddenException } from '@nestjs/common';
import { LoginCodeSecondFactor } from '@wepublish/login-code/api';
import {
  EMAIL_VERIFICATION_REQUIRED,
  ProfileResolver,
} from './profile.resolver';

const createResolver = (secondFactor: LoginCodeSecondFactor) => {
  const userService = {
    requestEmailChange: vi.fn().mockResolvedValue(undefined),
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
      'new@example.com'
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
