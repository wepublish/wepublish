import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { TotpResolver } from './totp.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('TotpResolver called with an api key', () => {
  it('has no account of its own to set up two-factor authentication for', async () => {
    const resolver = new TotpResolver({} as any);

    await expect(async () =>
      resolver.generateTotpSetup(undefined, apiKey)
    ).rejects.toThrow(ForbiddenException);
  });
});
