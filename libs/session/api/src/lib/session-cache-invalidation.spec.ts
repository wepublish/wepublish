import { PrismaClient } from '@prisma/client';
import {
  SessionCacheInvalidator,
  UserSession,
} from '@wepublish/authentication/api';
import { TotpService } from './totp.service';
import { SessionService } from './session.service';

describe('session cache after authentication changes', () => {
  const originalSecret = process.env['APP_SECRET_KEY'];
  let sessionCache: { invalidate: jest.Mock };
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    session: { delete: jest.Mock; deleteMany: jest.Mock };
  };

  beforeAll(() => {
    process.env['APP_SECRET_KEY'] = 'a-test-secret-that-is-long-enough';
  });

  afterAll(() => {
    process.env['APP_SECRET_KEY'] = originalSecret;
  });

  beforeEach(() => {
    sessionCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'user-1', totpEnabled: false }),
        update: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      session: {
        delete: jest.fn().mockResolvedValue({ id: 'session-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
  });

  const totp = () =>
    new TotpService(
      prisma as unknown as PrismaClient,
      sessionCache as unknown as SessionCacheInvalidator
    );

  const sessions = () =>
    new SessionService(
      prisma as unknown as PrismaClient,
      1,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      sessionCache as unknown as SessionCacheInvalidator
    );

  it('clears cached sessions after setting up two-factor authentication', async () => {
    await totp().setupTotp('user-1', 'user@example.com');

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  it('clears cached sessions after enabling two-factor authentication', async () => {
    const service = totp();
    await service.setupTotp('user-1', 'user@example.com');
    const encryptedSecret = prisma.user.update.mock.calls[0][0].data.totpSecret;
    prisma.user.findUnique.mockResolvedValue({
      totpSecret: encryptedSecret,
      totpEnabled: false,
    });
    jest.spyOn(service, 'verifyToken').mockReturnValue(true);
    sessionCache.invalidate.mockClear();

    await service.enableTotp('user-1', '123456');

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  it('clears cached sessions after resetting two-factor authentication', async () => {
    await totp().resetTotp('user-1');

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  it('clears cached sessions after logging out', async () => {
    await sessions().revokeSession({ token: 'token-1' } as UserSession);

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  it('clears cached sessions after impersonations are revoked', async () => {
    await sessions().revokeImpersonationSessions();

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });
});
