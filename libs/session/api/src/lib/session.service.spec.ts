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
  let jwts: { verifyJWT: Mock };
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
    jwts = { verifyJWT: vi.fn().mockRejectedValue(new Error('not preview')) };

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
