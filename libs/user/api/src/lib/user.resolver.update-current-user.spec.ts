import { ForbiddenException } from '@nestjs/common';
import { AuthSessionType } from '@wepublish/authentication/api';

import { UserResolver } from './user.resolver';

const creator = { id: 'user-1', email: 'editor@example.com' };

const keySession = {
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Print Import',
  token: 'wep_secret',
  permissions: [],
  organizationId: null,
  user: creator,
} as never;

const userSession = {
  type: AuthSessionType.User,
  id: 'session-1',
  user: creator,
  roles: [],
} as never;

const setup = () => {
  const service = {
    updateUser: vi.fn().mockResolvedValue(creator),
    validatePassword: vi.fn().mockResolvedValue(undefined),
    updateUserPassword: vi.fn().mockResolvedValue(creator),
  };

  return {
    service,
    resolver: new UserResolver(service as never, {} as never, {} as never),
  };
};

describe('UserResolver updateCurrentUser', () => {
  it('lets an api key change the profile of its creator', async () => {
    const { resolver, service } = setup();

    await resolver.updateCurrentUser({ name: 'Muster' } as never, keySession);

    expect(service.updateUser).toHaveBeenCalledWith({
      name: 'Muster',
      id: 'user-1',
    });
  });

  it('refuses to let an api key change the password of its creator', async () => {
    const { resolver, service } = setup();

    await expect(
      resolver.updateCurrentUser(
        { name: 'Muster', password: 'a-new-Password-123' } as never,
        keySession
      )
    ).rejects.toThrow(ForbiddenException);
    expect(service.updateUser).not.toHaveBeenCalled();
    expect(service.updateUserPassword).not.toHaveBeenCalled();
  });

  it('never writes the password of a signed-in user unhashed', async () => {
    const { resolver, service } = setup();

    await resolver.updateCurrentUser(
      { name: 'Muster', password: 'a-new-Password-123' } as never,
      userSession
    );

    expect(service.updateUser).toHaveBeenCalledWith({
      name: 'Muster',
      id: 'user-1',
    });
    expect(service.validatePassword).toHaveBeenCalledWith('a-new-Password-123');
    expect(service.updateUserPassword).toHaveBeenCalledWith(
      'user-1',
      'a-new-Password-123',
      { keepSessionId: 'session-1' }
    );
  });
});
