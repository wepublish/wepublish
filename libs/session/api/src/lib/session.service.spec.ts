import type { Mock, MockInstance } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { PrismaClient, SessionOrigin } from '@prisma/client';
import {
  AuthenticationService,
  isSessionRestricted,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import { ChallengeService } from '@wepublish/challenge/api';
import {
  InvalidLoginCodeError,
  LoginCodeDisabledError,
  LoginCodeRateLimiter,
  LoginCodeService,
} from '@wepublish/login-code/api';
import { createMock } from '@wepublish/testing';
import { NotActiveError, WepublishLoginOnlyError } from './session.errors';
import { SessionService } from './session.service';
import { TotpService } from './totp.service';

const activeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'reader@example.com',
  active: true,
  totpEnabled: false,
  emailVerifiedAt: null,
  ...overrides,
});

// What the authentication service answers for a reader without a placeholder
// address: only how the session logged in and what it confirmed count.
const sessionRestriction = vi.fn(
  async ({
    origin,
    emailConfirmedAt,
  }: {
    origin: SessionOrigin;
    emailConfirmedAt: Date | null;
  }) => ({
    placeholderEmail: false,
    roles: [],
    restricted: isSessionRestricted({
      origin,
      placeholderEmail: false,
      readerOnly: true,
      emailConfirmedAt,
    }),
  })
);

const codeRecord = (user: ReturnType<typeof activeUser>) => ({
  id: 'code-1',
  userId: user.id,
  user,
});

describe('SessionService.createSessionWithLoginCode', () => {
  let service: SessionService;
  let loginCodes: ReturnType<typeof createMock<LoginCodeService>>;
  let limiter: ReturnType<typeof createMock<LoginCodeRateLimiter>>;
  let totp: ReturnType<typeof createMock<TotpService>>;
  let challenge: ReturnType<typeof createMock<ChallengeService>>;
  let authentication: ReturnType<typeof createMock<AuthenticationService>>;
  let createUserSession: MockInstance;

  beforeEach(() => {
    loginCodes = createMock(LoginCodeService);
    limiter = createMock(LoginCodeRateLimiter);
    totp = createMock(TotpService);
    challenge = createMock(ChallengeService);
    authentication = createMock(AuthenticationService);

    limiter.assertAllowed!.mockResolvedValue(undefined);
    limiter.recordFailure!.mockResolvedValue(undefined);
    limiter.clear!.mockResolvedValue(undefined);
    loginCodes.consume!.mockResolvedValue(undefined);
    loginCodes.isEnabled!.mockResolvedValue(true);
    authentication.sessionRestriction!.mockImplementation(sessionRestriction);

    service = new SessionService(
      {} as never,
      1000,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      totp as never,
      authentication as never,
      loginCodes as never,
      limiter as never,
      challenge as never
    );

    createUserSession = vi
      .spyOn(service, 'createUserSession')
      .mockResolvedValue({ token: 'session-token' } as never);
  });

  it('consumes one use and opens a purl session for an active user', async () => {
    const user = activeUser();
    loginCodes.verify!.mockResolvedValue(codeRecord(user) as never);

    const result = await service.createSessionWithLoginCode(
      'ABCDE-FGHJK',
      undefined,
      'fp'
    );

    expect(result).toEqual({ token: 'session-token' });
    expect(limiter.assertAllowed).toHaveBeenCalledWith('fp', false);
    expect(loginCodes.consume).toHaveBeenCalledTimes(1);
    expect(loginCodes.consume).toHaveBeenCalledWith('code-1');
    expect(limiter.clear).toHaveBeenCalledWith('fp');
    expect(limiter.recordFailure).not.toHaveBeenCalled();
    expect(createUserSession).toHaveBeenCalledWith(user, {
      origin: SessionOrigin.purl,
    });
  });

  it('refuses login codes while the medium has them switched off, before any rate limiting or challenge', async () => {
    loginCodes.isEnabled!.mockResolvedValue(false);

    await expect(
      service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp', {
        challengeID: 'challenge-1',
        challengeSolution: 'solution',
      })
    ).rejects.toBeInstanceOf(LoginCodeDisabledError);

    expect(challenge.validateChallenge).not.toHaveBeenCalled();
    expect(limiter.assertAllowed).not.toHaveBeenCalled();
    expect(limiter.recordFailure).not.toHaveBeenCalled();
    expect(loginCodes.verify).not.toHaveBeenCalled();
    expect(createUserSession).not.toHaveBeenCalled();
  });

  it('refuses inactive users without consuming a use', async () => {
    loginCodes.verify!.mockResolvedValue(
      codeRecord(activeUser({ active: false })) as never
    );

    await expect(
      service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp')
    ).rejects.toBeInstanceOf(NotActiveError);

    expect(loginCodes.consume).not.toHaveBeenCalled();
    expect(limiter.recordFailure).toHaveBeenCalledWith('fp');
    expect(createUserSession).not.toHaveBeenCalled();
  });

  it('asks for the TOTP code first and does not count that as a failed guess', async () => {
    loginCodes.verify!.mockResolvedValue(
      codeRecord(activeUser({ totpEnabled: true })) as never
    );

    await expect(
      service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp')
    ).rejects.toThrow('TOTP_REQUIRED');

    expect(loginCodes.consume).not.toHaveBeenCalled();
    expect(limiter.recordFailure).not.toHaveBeenCalled();
  });

  it('verifies the TOTP code when one is given', async () => {
    const user = activeUser({ totpEnabled: true });
    loginCodes.verify!.mockResolvedValue(codeRecord(user) as never);
    totp.verifyUserTotp!.mockResolvedValue(true as never);

    await service.createSessionWithLoginCode('ABCDE-FGHJK', '123456', 'fp');

    expect(totp.verifyUserTotp).toHaveBeenCalledWith('user-1', '123456');
    expect(loginCodes.consume).toHaveBeenCalledTimes(1);
  });

  it('records a failed guess for an invalid code', async () => {
    loginCodes.verify!.mockRejectedValue(new InvalidLoginCodeError());

    await expect(
      service.createSessionWithLoginCode('WRONG-CODE0', undefined, 'fp')
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(limiter.recordFailure).toHaveBeenCalledWith('fp');
    expect(loginCodes.consume).not.toHaveBeenCalled();
  });

  it('does not open a session when the client is locked out', async () => {
    limiter.assertAllowed!.mockRejectedValue(
      new BadRequestException('TOO_MANY_ATTEMPTS')
    );

    await expect(
      service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp')
    ).rejects.toThrow('TOO_MANY_ATTEMPTS');

    expect(loginCodes.verify).not.toHaveBeenCalled();
  });

  it('accepts a valid challenge answer to lift the global lock', async () => {
    const user = activeUser();
    loginCodes.verify!.mockResolvedValue(codeRecord(user) as never);
    challenge.validateChallenge!.mockResolvedValue({ valid: true } as never);

    await service.createSessionWithLoginCode('ABCDE-FGHJK', undefined, 'fp', {
      challengeID: 'c1',
      challengeSolution: 's1',
    });

    expect(challenge.validateChallenge).toHaveBeenCalledWith({
      challengeID: 'c1',
      solution: 's1',
    });
    expect(limiter.assertAllowed).toHaveBeenCalledWith('fp', true);
  });
});

describe('SessionService.createSessionWithJWT', () => {
  it('logs in with a login link (jwt) without asking whether personal login codes are switched on', async () => {
    const user = activeUser();
    const loginCodes = createMock(LoginCodeService);
    loginCodes.isEnabled!.mockResolvedValue(false);

    const service = new SessionService(
      { user: { findUnique: vi.fn() } } as never,
      1000,
      {} as never,
      {} as never,
      { authenticateUserWithJWT: vi.fn().mockResolvedValue(user) } as never,
      {
        verifyImpersonationGrant: vi.fn().mockResolvedValue(null),
        verifyJWT: vi.fn().mockRejectedValue(new Error('not a preview jwt')),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      loginCodes as never,
      {} as never,
      {} as never
    );
    const createUserSession = vi
      .spyOn(service, 'createUserSession')
      .mockResolvedValue({ token: 'session-token' } as never);

    await expect(
      service.createSessionWithJWT('login-link-jwt')
    ).resolves.toEqual({ token: 'session-token' });
    expect(createUserSession).toHaveBeenCalledWith(user, {
      origin: SessionOrigin.jwt,
    });
    expect(loginCodes.isEnabled).not.toHaveBeenCalled();
  });
});

describe('SessionService for accounts connected to the We.Publish login', () => {
  const connected = {
    id: 'user-1',
    email: 'jane@wepublish.ch',
    active: true,
    totpEnabled: false,
    wepublishLoginSubject: 'zitadel-1',
  };
  const ordinary = { ...connected, wepublishLoginSubject: null };

  let prisma: {
    user: { findUnique: Mock; update: Mock };
    session: { create: Mock };
  };
  let passwords: { authenticateUserWithEmailAndPassword: Mock };
  let jwtLogins: { authenticateUserWithJWT: Mock };
  let jwts: { verifyJWT: Mock; verifyImpersonationGrant: Mock };
  let service: SessionService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      session: {
        create: vi
          .fn()
          .mockResolvedValue({ id: 'session-1', createdAt: new Date() }),
      },
    };
    passwords = { authenticateUserWithEmailAndPassword: vi.fn() };
    jwtLogins = { authenticateUserWithJWT: vi.fn() };
    jwts = {
      verifyJWT: vi.fn().mockRejectedValue(new Error('not preview')),
      verifyImpersonationGrant: vi.fn().mockResolvedValue(null),
    };

    service = new SessionService(
      prisma as unknown as PrismaClient,
      60_000,
      passwords as never,
      {} as never,
      jwtLogins as never,
      jwts as never,
      { settingByName: vi.fn().mockResolvedValue(null) } as never,
      {} as never,
      {} as never,
      {
        sessionRestriction,
      } as never,
      {} as never,
      {} as never,
      {} as never,
      { invalidate: vi.fn() } as unknown as SessionCacheInvalidator
    );
  });

  it('refuses a password login', async () => {
    passwords.authenticateUserWithEmailAndPassword.mockResolvedValue(connected);

    await expect(
      service.createSessionWithEmailAndPassword('jane@wepublish.ch', 'secret')
    ).rejects.toBeInstanceOf(WepublishLoginOnlyError);
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('still signs other accounts in with their password', async () => {
    passwords.authenticateUserWithEmailAndPassword.mockResolvedValue(ordinary);

    await expect(
      service.createSessionWithEmailAndPassword('jane@wepublish.ch', 'secret')
    ).resolves.toMatchObject({ sessionId: 'session-1' });
  });

  it('refuses a login link', async () => {
    jwtLogins.authenticateUserWithJWT.mockResolvedValue(connected);

    await expect(
      service.createSessionWithJWT('login-link')
    ).rejects.toBeInstanceOf(WepublishLoginOnlyError);
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('still signs other accounts in with a login link', async () => {
    jwtLogins.authenticateUserWithJWT.mockResolvedValue(ordinary);

    await expect(
      service.createSessionWithJWT('login-link')
    ).resolves.toMatchObject({ sessionId: 'session-1' });
  });

  it('lets the editor hand its own session on to the website preview', async () => {
    jwts.verifyJWT.mockResolvedValue('user-1');
    prisma.user.findUnique.mockResolvedValue(connected);

    await expect(
      service.createSessionWithJWT('preview')
    ).resolves.toMatchObject({ sessionId: 'session-1' });
    expect(jwts.verifyJWT).toHaveBeenCalledWith('preview', 'preview');
  });
});

describe('SessionService impersonation', () => {
  const target = {
    id: 'user-2',
    email: 'reader@example.com',
    active: true,
    totpEnabled: true,
    wepublishLoginSubject: null,
  };
  const grant = {
    userId: 'user-2',
    durationMinutes: 60,
    impersonatedBy: 'jane@wepublish.ch',
    reason: 'Ticket 4711',
    jti: 'grant-1',
  };

  let prisma: {
    user: { findUnique: Mock; update: Mock };
    session: { create: Mock };
    impersonationGrant: { updateMany: Mock };
  };
  let jwts: { verifyImpersonationGrant: Mock; verifyJWT: Mock };
  let service: SessionService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(target),
        update: vi.fn().mockResolvedValue({}),
      },
      session: {
        create: vi
          .fn()
          .mockResolvedValue({ id: 'session-9', createdAt: new Date() }),
      },
      impersonationGrant: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    jwts = {
      verifyImpersonationGrant: vi.fn().mockResolvedValue(grant),
      verifyJWT: vi.fn().mockRejectedValue(new Error('not preview')),
    };

    service = new SessionService(
      prisma as unknown as PrismaClient,
      60_000,
      {} as never,
      {} as never,
      { authenticateUserWithJWT: vi.fn() } as never,
      jwts as never,
      { settingByName: vi.fn().mockResolvedValue(null) } as never,
      {} as never,
      {} as never,
      {
        sessionRestriction,
      } as never,
      {} as never,
      {} as never,
      {} as never,
      { invalidate: vi.fn() } as unknown as SessionCacheInvalidator
    );
  });

  it('marks a session that may impersonate', async () => {
    await service.createUserSession(target as never, { canImpersonate: true });

    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ canImpersonate: true }),
      })
    );
  });

  it('records a session of a login that names no origin as a password one, never restricted', async () => {
    // The We.Publish staff login has nothing to do with login codes, the only
    // origin that restricts a session.
    const session = await service.createUserSession(target as never, {});

    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ origin: SessionOrigin.password }),
      })
    );
    expect(session).toMatchObject({
      origin: SessionOrigin.password,
      restricted: false,
    });
  });

  // The account's address may have been confirmed long ago, by its owner; the
  // person holding the code now has confirmed nothing.
  it('starts every login-code session restricted, whatever the account confirmed before', async () => {
    const session = await service.createUserSession(
      { ...target, emailVerifiedAt: new Date() } as never,
      { origin: SessionOrigin.purl }
    );

    expect(sessionRestriction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        origin: SessionOrigin.purl,
        emailConfirmedAt: null,
      })
    );
    expect(session.restricted).toBe(true);
  });

  it('redeems an impersonation grant once for a session of an hour, without TOTP', async () => {
    const before = Date.now();
    const session = await service.createSessionWithJWT('grant');

    expect(prisma.impersonationGrant.updateMany).toHaveBeenCalledWith({
      where: { jti: 'grant-1', redeemedAt: null },
      data: { redeemedAt: expect.any(Date) },
    });
    const { data } = prisma.session.create.mock.calls[0][0];
    expect(data).toMatchObject({
      impersonatedBy: 'jane@wepublish.ch',
      impersonationReason: 'Ticket 4711',
      user: { connect: { id: 'user-2' } },
    });
    expect(data.canImpersonate).toBeUndefined();
    expect(data.expiresAt.getTime() - before).toBeGreaterThanOrEqual(
      60 * 60 * 1000 - 1000
    );
    expect(session.impersonated).toBe(true);
  });

  it('refuses a grant that was already redeemed', async () => {
    prisma.impersonationGrant.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.createSessionWithJWT('grant')).rejects.toThrow();
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('refuses a grant for an account that was deactivated or connected since', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ ...target, active: false });
    await expect(service.createSessionWithJWT('grant')).rejects.toThrow();

    prisma.user.findUnique.mockResolvedValueOnce({
      ...target,
      wepublishLoginSubject: 'zitadel-2',
    });
    await expect(service.createSessionWithJWT('grant')).rejects.toThrow();

    expect(prisma.session.create).not.toHaveBeenCalled();
  });
});
