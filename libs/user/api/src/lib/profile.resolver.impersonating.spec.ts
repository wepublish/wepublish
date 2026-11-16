import {
  AuthSessionType,
  ImpersonatingError,
} from '@wepublish/authentication/api';
import { ProfileResolver } from './profile.resolver';

describe('ProfileResolver while signed in as someone else', () => {
  const session = {
    type: AuthSessionType.User,
    id: 'session-2',
    impersonatedBy: 'jane@wepublish.ch',
    user: { id: 'user-2', wepublishLoginSubject: null },
  } as never;

  const userService = {
    validatePassword: vi.fn(),
    updateUserPassword: vi.fn(),
    requestEmailChange: vi.fn(),
    confirmEmailChange: vi.fn(),
  };
  const resolver = new ProfileResolver(userService as never, {} as never);

  it('refuses to change the password', async () => {
    await expect(
      resolver.updatePassword(
        'a-new-Password-123',
        'a-new-Password-123',
        session
      )
    ).rejects.toBeInstanceOf(ImpersonatingError);
    expect(userService.updateUserPassword).not.toHaveBeenCalled();
  });

  it('refuses to change the email address', async () => {
    await expect(
      resolver.requestEmailChange('new@example.com', session)
    ).rejects.toBeInstanceOf(ImpersonatingError);
    await expect(
      resolver.confirmEmailChange('new@example.com', session)
    ).rejects.toBeInstanceOf(ImpersonatingError);
    expect(userService.requestEmailChange).not.toHaveBeenCalled();
    expect(userService.confirmEmailChange).not.toHaveBeenCalled();
  });
});
