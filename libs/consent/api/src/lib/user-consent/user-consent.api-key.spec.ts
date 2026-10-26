import { ForbiddenException } from '@nestjs/common';
import { AuthSessionType } from '@wepublish/authentication/api';

import { UserConsentResolver } from './user-consent.resolver';
import { UserConsentService } from './user-consent.service';

vi.mock('@wepublish/user/api', () => ({
  User: class User {},
  UserDataloaderService: class UserDataloaderService {},
}));

const keyOfAdmin = {
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'CRM sync',
  token: 'wep_secret',
  permissions: [],
  organizationId: null,
  user: { id: 'admin-1', roleIDs: ['admin'] },
} as never;

const consentOf = (userId: string) => ({
  id: 'consent-1',
  user: { id: userId },
});

const prisma = () => ({
  userConsent: {
    findFirst: vi.fn().mockResolvedValue(consentOf('user-2')),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({}),
  },
});

describe('user consents for an api key whose creator is an admin', () => {
  it('does not borrow the admin role to record consent for somebody else', () => {
    const service = { createUserConsent: vi.fn() };

    expect(() =>
      new UserConsentResolver(service as never, {} as never).createUserConsent(
        keyOfAdmin,
        { userId: 'user-2', consentId: 'c', value: true } as never
      )
    ).toThrow(ForbiddenException);
    expect(service.createUserConsent).not.toHaveBeenCalled();
  });

  it('records consent for the creator themselves', () => {
    const service = { createUserConsent: vi.fn() };

    new UserConsentResolver(service as never, {} as never).createUserConsent(
      keyOfAdmin,
      { userId: 'admin-1', consentId: 'c', value: true } as never
    );

    expect(service.createUserConsent).toHaveBeenCalled();
  });

  it('does not borrow the admin role to change or delete somebody else consent', async () => {
    const client = prisma();
    const service = new UserConsentService(client as never);

    await expect(
      service.updateUserConsent('consent-1', true, keyOfAdmin)
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.deleteUserConsent('consent-1', keyOfAdmin)
    ).rejects.toThrow(ForbiddenException);
    expect(client.userConsent.update).not.toHaveBeenCalled();
    expect(client.userConsent.delete).not.toHaveBeenCalled();
  });
});
