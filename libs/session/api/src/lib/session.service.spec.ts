import type { Mock } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { SessionService } from './session.service';
import { WepublishLoginOnlyError } from './session.errors';

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
