import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { SensitiveDataUserResolver } from './sensitive-data-user.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('SensitiveDataUserResolver called with an api key', () => {
  it('lists no permissions as the key‘s creator’s own', async () => {
    const resolver = new SensitiveDataUserResolver(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    await expect(
      resolver.permissions(apiKey, { id: 'creator-1' } as any)
    ).resolves.toEqual([]);
  });
});
