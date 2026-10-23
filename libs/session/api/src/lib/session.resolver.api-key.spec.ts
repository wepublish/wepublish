import { ForbiddenException } from '@nestjs/common';
import { AuthSessionType } from '@wepublish/authentication/api';

import { SessionResolver } from './session.resolver';
import { TotpResolver } from './totp.resolver';

const keySession = {
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Preview bot',
  token: 'wep_secret',
  permissions: ['CAN_PREVIEW'],
  organizationId: null,
  user: { id: 'user-1', email: 'editor@example.com' },
} as never;

describe('SessionResolver for an api key acting as its creator', () => {
  const sessionService = () => ({
    revokeSession: vi.fn().mockResolvedValue(true),
    createJWTForWebsiteLogin: vi.fn().mockResolvedValue({ token: 'jwt' }),
  });

  it('does not mint a login for the creator, which would carry all their roles', async () => {
    const service = sessionService();

    await expect(
      new SessionResolver(service as never).createJWTForWebsiteLogin(keySession)
    ).rejects.toThrow(ForbiddenException);
    expect(service.createJWTForWebsiteLogin).not.toHaveBeenCalled();
  });

  it('still mints a preview login for a signed-in user', async () => {
    const service = sessionService();

    await new SessionResolver(service as never).createJWTForWebsiteLogin({
      type: AuthSessionType.User,
      user: { id: 'user-1' },
    } as never);

    expect(service.createJWTForWebsiteLogin).toHaveBeenCalledWith('user-1');
  });

  it('has no session to revoke for an api key', async () => {
    const service = sessionService();

    expect(
      await new SessionResolver(service as never).revokeActiveSession(
        keySession
      )
    ).toBe(false);
    expect(service.revokeSession).not.toHaveBeenCalled();
  });
});

describe('TotpResolver for an api key acting as its creator', () => {
  const totpService = () => ({
    setupTotp: vi.fn().mockResolvedValue({}),
    enableTotp: vi.fn().mockResolvedValue(true),
  });

  it('does not set up two-factor authentication for the creator', async () => {
    const service = totpService();

    await expect(
      new TotpResolver(service as never).generateTotpSetup(
        undefined,
        keySession
      )
    ).rejects.toThrow(ForbiddenException);
    expect(service.setupTotp).not.toHaveBeenCalled();
  });

  it('does not enable two-factor authentication for the creator', async () => {
    const service = totpService();

    await expect(
      new TotpResolver(service as never).enableTotp('123456', keySession)
    ).rejects.toThrow(ForbiddenException);
    expect(service.enableTotp).not.toHaveBeenCalled();
  });
});
