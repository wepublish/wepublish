import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { ProfileResolver } from './profile.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('ProfileResolver called with an api key', () => {
  const resolver = new ProfileResolver({} as any, {} as any);

  it('has no password or email address of its own to change', async () => {
    await expect(async () =>
      resolver.updatePassword('secret', 'secret', apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.requestEmailChange('new@example.test', apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.confirmEmailChange('new@example.test', apiKey)
    ).rejects.toThrow(ForbiddenException);
  });
});
