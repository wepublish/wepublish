import { ProfileResolver } from './profile.resolver';

describe('ProfileResolver updatePassword', () => {
  it('keeps the session the reader changed the password in', async () => {
    const userService = {
      validatePassword: jest.fn().mockResolvedValue(undefined),
      updateUserPassword: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };
    const resolver = new ProfileResolver(userService as any, {} as any);

    await resolver.updatePassword('a-new-Password-123', 'a-new-Password-123', {
      id: 'session-1',
      user: { id: 'user-1' },
    } as any);

    expect(userService.updateUserPassword).toHaveBeenCalledWith(
      'user-1',
      'a-new-Password-123',
      { keepSessionId: 'session-1' }
    );
  });
});
