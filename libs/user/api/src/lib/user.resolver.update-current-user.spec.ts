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
});
