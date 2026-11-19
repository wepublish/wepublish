import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { UserConsentResolver } from './user-consent.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('UserConsentResolver called with an api key', () => {
  it('may not give, change or withdraw consents', async () => {
    const userConsents = {
      createUserConsent: vi.fn(),
      updateUserConsent: vi.fn(),
      deleteUserConsent: vi.fn(),
    };
    const resolver = new UserConsentResolver(userConsents as any, {} as any);

    await expect(async () =>
      resolver.createUserConsent(apiKey, {
        userId: 'creator-1',
        consentId: 'consent-1',
        value: true,
      })
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.updateUserConsent(apiKey, 'user-consent-1', true)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.deleteUserConsent('user-consent-1', apiKey)
    ).rejects.toThrow(ForbiddenException);
    expect(userConsents.createUserConsent).not.toHaveBeenCalled();
    expect(userConsents.updateUserConsent).not.toHaveBeenCalled();
    expect(userConsents.deleteUserConsent).not.toHaveBeenCalled();
  });
});
