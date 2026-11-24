import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { UserResolver } from './user.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('UserResolver called with an api key', () => {
  it('has no account of its own to update', async () => {
    const resolver = new UserResolver({} as any, {} as any, {} as any);

    await expect(async () =>
      resolver.updateCurrentUser({} as any, apiKey)
    ).rejects.toThrow(ForbiddenException);
  });
});
