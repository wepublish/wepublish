import type { Mock } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  SessionCacheInvalidator,
  UserSession,
} from '@wepublish/authentication/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { createCache } from 'cache-manager';
import * as OTPAuth from 'otpauth';
import { TotpService } from './totp.service';
import { SessionService } from './session.service';

describe('session cache after authentication changes', () => {
  const originalSecret = process.env['APP_SECRET_KEY'];
  let sessionCache: { invalidate: Mock };
  let prisma: {
    user: { findUnique: Mock; update: Mock };
    session: { delete: Mock; deleteMany: Mock };
  };

  beforeAll(() => {
    process.env['APP_SECRET_KEY'] = 'a-test-secret-that-is-long-enough';
  });

  afterAll(() => {
    process.env['APP_SECRET_KEY'] = originalSecret;
  });

  beforeEach(() => {
    sessionCache = { invalidate: vi.fn().mockResolvedValue(undefined) };
    prisma = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'user-1', totpEnabled: false }),
        update: vi.fn().mockResolvedValue({ id: 'user-1' }),
      },
      session: {
        delete: vi.fn().mockResolvedValue({ id: 'session-1' }),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
  });

  const totp = () =>
    new TotpService(
      prisma as unknown as PrismaClient,
      sessionCache as unknown as SessionCacheInvalidator,
      new KvTtlCacheService(createCache())
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
    const { secret } = await service.setupTotp('user-1', 'user@example.com');
    const encryptedSecret = prisma.user.update.mock.calls[0][0].data.totpSecret;
    prisma.user.findUnique.mockResolvedValue({
      totpSecret: encryptedSecret,
      totpEnabled: false,
    });
    sessionCache.invalidate.mockClear();
    const code = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    }).generate();

    await service.enableTotp('user-1', code);

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
