import { ForbiddenException } from '@nestjs/common';
import { AuditLogAction, AuditLogActorType } from '@prisma/client';
import type { Mock } from 'vitest';
import { InvalidCredentialsError } from './session.errors';
import { WepublishLoginService } from './wepublish-login.service';
import {
  WEPUBLISH_LOGIN_AUTHORIZATION_URL,
  WEPUBLISH_LOGIN_PRODUCTION_CLIENT_ID,
  WEPUBLISH_LOGIN_SCOPE,
  type WepublishIdentity,
} from './wepublish-login';

const editor = 'https://editor-bajour.wepublish.cloud';
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

const identity: WepublishIdentity = {
  subject: 'zitadel-1',
  email: 'Jane@WePublish.ch',
  emailVerified: true,
  firstName: 'Jane',
  lastName: 'Doe',
  name: 'Jane Doe',
  roles: ['login-cms-admin-production'],
  amr: ['pwd', 'mfa'],
};

const existingUser = {
  id: 'user-1',
  email: 'jane@wepublish.ch',
  active: true,
  roleIDs: ['editor'],
  firstName: 'Janet',
  name: 'Smith',
  wepublishLoginSubject: null,
};

const connectedUser = {
  ...existingUser,
  email: 'jane.doe@wepublish.ch',
  roleIDs: ['admin'],
  firstName: 'Jane',
  name: 'Doe',
  wepublishLoginSubject: 'zitadel-1',
};

describe('WepublishLoginService', () => {
  const env = { ...process.env };

  let prisma: {
    user: { findUnique: Mock; findFirst: Mock; update: Mock };
    session: { deleteMany: Mock };
    $transaction: Mock;
  };
  let identityService: { signIn: Mock };
  let userService: { createUser: Mock; updateUser: Mock };
  let sessionService: { createUserSession: Mock };
  let sessionCache: { invalidate: Mock };
  let auditLog: { record: Mock };
  let service: WepublishLoginService;

  beforeEach(() => {
    process.env = { ...env, APP_ENVIRONMENT: 'production', EDITOR_URL: editor };

    prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(existingUser),
        update: vi.fn().mockImplementation(async ({ data }) => data),
      },
      session: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
      $transaction: vi.fn(operations => Promise.all(operations)),
    };
    identityService = { signIn: vi.fn().mockResolvedValue(identity) };
    userService = {
      createUser: vi.fn().mockImplementation(async input => ({
        id: 'user-2',
        wepublishLoginSubject: null,
        ...input,
        email: input.email.toLowerCase(),
      })),
      updateUser: vi.fn().mockImplementation(async ({ id, ...input }) => ({
        ...existingUser,
        id,
        ...input,
      })),
    };
    sessionService = {
      createUserSession: vi.fn().mockImplementation(async user => ({
        user,
        token: 'token-1',
        sessionId: 'session-1',
      })),
    };
    sessionCache = { invalidate: vi.fn() };
    auditLog = { record: vi.fn() };

    service = new WepublishLoginService(
      prisma as never,
      identityService as never,
      userService as never,
      sessionService as never,
      sessionCache as never,
      auditLog as never
    );
  });

  afterAll(() => {
    process.env = env;
  });

  describe('client', () => {
    it('describes how the editor sends people to We.Publish', () => {
      expect(service.client()).toEqual({
        authorizationUrl: WEPUBLISH_LOGIN_AUTHORIZATION_URL,
        clientId: WEPUBLISH_LOGIN_PRODUCTION_CLIENT_ID,
        redirectUri: `${editor}/login/wepublish`,
        scope: WEPUBLISH_LOGIN_SCOPE,
      });
    });

    it('is absent where the login is off', () => {
      delete process.env['APP_ENVIRONMENT'];

      expect(service.client()).toBeNull();
    });
  });

  describe('createSession', () => {
    it('redeems the code with the client and address of this environment', async () => {
      await service.createSession('code-1', 'verifier-1');

      expect(identityService.signIn).toHaveBeenCalledWith({
        clientId: WEPUBLISH_LOGIN_PRODUCTION_CLIENT_ID,
        redirectUri: `${editor}/login/wepublish`,
        code: 'code-1',
        codeVerifier: 'verifier-1',
      });
    });

    it('signs in as the user with that email, not as an impersonation', async () => {
      const session = await service.createSession('code-1', 'verifier-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: 'Jane@WePublish.ch', mode: 'insensitive' },
        },
      });
      expect(sessionService.createUserSession).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1' }),
        { ttlMs: TWELVE_HOURS }
      );
      expect(userService.createUser).not.toHaveBeenCalled();
      expect(session.token).toBe('token-1');
    });

    it('lets the session impersonate when We.Publish grants impersonate-cms', async () => {
      prisma.user.findUnique.mockResolvedValue(connectedUser);
      identityService.signIn.mockResolvedValue({
        ...identity,
        roles: [...identity.roles, 'impersonate-cms'],
      });

      await service.createSession('code-1', 'verifier-1');

      expect(sessionService.createUserSession).toHaveBeenCalledWith(
        connectedUser,
        { ttlMs: TWELVE_HOURS, canImpersonate: true }
      );
    });

    it('signs in as the account already connected to this We.Publish identity, even under another email', async () => {
      prisma.user.findUnique.mockResolvedValue(connectedUser);

      await service.createSession('code-1', 'verifier-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { wepublishLoginSubject: 'zitadel-1' },
      });
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(sessionService.createUserSession).toHaveBeenCalledWith(
        connectedUser,
        { ttlMs: TWELVE_HOURS }
      );
    });

    it('connects an account found by email and ends its other sessions', async () => {
      await service.createSession('code-1', 'verifier-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { wepublishLoginSubject: 'zitadel-1' },
      });
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userID: 'user-1' },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(sessionCache.invalidate).toHaveBeenCalled();
      expect(
        prisma.session.deleteMany.mock.invocationCallOrder[0]
      ).toBeLessThan(
        sessionService.createUserSession.mock.invocationCallOrder[0]
      );
    });

    it('keeps the other sessions of an account that is already connected', async () => {
      prisma.user.findUnique.mockResolvedValue(connectedUser);

      await service.createSession('code-1', 'verifier-1');

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.session.deleteMany).not.toHaveBeenCalled();
    });

    it('makes the user an admin again and takes the names from We.Publish', async () => {
      await service.createSession('code-1', 'verifier-1');

      expect(userService.updateUser).toHaveBeenCalledWith({
        id: 'user-1',
        firstName: 'Jane',
        name: 'Doe',
        roleIDs: ['admin'],
        active: true,
      });
      expect(sessionService.createUserSession.mock.calls[0][0]).toMatchObject({
        roleIDs: ['admin'],
        firstName: 'Jane',
      });
    });

    it('resets a connected account whose role was changed in the editor', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...connectedUser,
        roleIDs: ['editor', 'admin'],
      });

      await service.createSession('code-1', 'verifier-1');

      expect(userService.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({ roleIDs: ['admin'] })
      );
    });

    it('leaves a connected admin with the same names as it is', async () => {
      prisma.user.findUnique.mockResolvedValue(connectedUser);

      await service.createSession('code-1', 'verifier-1');

      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('creates an admin with a verified email when nobody has that email', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await service.createSession('code-1', 'verifier-1');

      expect(userService.createUser).toHaveBeenCalledWith({
        email: 'Jane@WePublish.ch',
        firstName: 'Jane',
        name: 'Doe',
        flair: null,
        active: true,
        emailVerifiedAt: expect.any(Date),
        roleIDs: ['admin'],
        properties: [],
        skipMail: true,
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { wepublishLoginSubject: 'zitadel-1' },
      });
      expect(userService.updateUser).not.toHaveBeenCalled();
      expect(sessionService.createUserSession.mock.calls[0][0]).toMatchObject({
        id: 'user-2',
      });
    });

    it('names a user after the full name or the email when We.Publish has no family name', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      identityService.signIn
        .mockResolvedValueOnce({ ...identity, lastName: undefined })
        .mockResolvedValueOnce({
          ...identity,
          firstName: undefined,
          lastName: undefined,
          name: undefined,
        });

      await service.createSession('code-1', 'verifier-1');
      await service.createSession('code-2', 'verifier-2');

      expect(userService.createUser.mock.calls[0][0]).toMatchObject({
        firstName: null,
        name: 'Jane Doe',
      });
      expect(userService.createUser.mock.calls[1][0]).toMatchObject({
        firstName: null,
        name: 'Jane@WePublish.ch',
      });
    });

    it('keeps the names within what a user may hold', async () => {
      identityService.signIn.mockResolvedValue({
        ...identity,
        firstName: 'J'.repeat(80),
        lastName: 'D'.repeat(80),
      });

      await service.createSession('code-1', 'verifier-1');

      const [input] = userService.updateUser.mock.calls[0];
      expect(input.firstName).toHaveLength(50);
      expect(input.name).toHaveLength(50);
    });

    it('refuses an account without the role of this environment', async () => {
      process.env['APP_ENVIRONMENT'] = 'staging';

      await expect(
        service.createSession('code-1', 'verifier-1')
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(sessionService.createUserSession).not.toHaveBeenCalled();
    });

    it('refuses a sign-in without a second factor', async () => {
      identityService.signIn.mockResolvedValue({ ...identity, amr: ['pwd'] });

      await expect(
        service.createSession('code-1', 'verifier-1')
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(sessionService.createUserSession).not.toHaveBeenCalled();
    });

    it('reactivates an account a medium switched off', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...connectedUser,
        active: false,
      });

      await service.createSession('code-1', 'verifier-1');

      expect(userService.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1', active: true })
      );
      expect(sessionService.createUserSession.mock.calls[0][0]).toMatchObject({
        active: true,
      });
    });

    it('refuses everything where the login is off, without asking We.Publish', async () => {
      delete process.env['EDITOR_URL'];

      await expect(
        service.createSession('code-1', 'verifier-1')
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(identityService.signIn).not.toHaveBeenCalled();
    });

    it('passes on a code We.Publish refuses', async () => {
      identityService.signIn.mockRejectedValue(new InvalidCredentialsError());

      await expect(
        service.createSession('code-1', 'verifier-1')
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it('writes the sign-in to the audit log', async () => {
      prisma.user.findUnique.mockResolvedValue(connectedUser);

      await service.createSession('code-1', 'verifier-1');

      expect(auditLog.record).toHaveBeenCalledTimes(1);
      expect(auditLog.record).toHaveBeenCalledWith({
        mutation: 'createSessionWithWepublishLogin',
        action: AuditLogAction.other,
        entity: 'Session',
        recordId: 'session-1',
        actorType: AuditLogActorType.user,
        userId: 'user-1',
        userEmail: 'jane.doe@wepublish.ch',
        sessionId: 'session-1',
        success: true,
        errorMessage: null,
      });
    });

    it('writes connecting and resetting an account to the audit log', async () => {
      await service.createSession('code-1', 'verifier-1');

      expect(auditLog.record).toHaveBeenCalledWith({
        mutation: 'createSessionWithWepublishLogin',
        action: AuditLogAction.update,
        entity: 'User',
        recordId: 'user-1',
        actorType: AuditLogActorType.user,
        userId: 'user-1',
        userEmail: 'jane@wepublish.ch',
        sessionId: null,
        success: true,
        errorMessage: null,
      });
    });

    it('writes the creation of a user to the audit log', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await service.createSession('code-1', 'verifier-1');

      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditLogAction.create,
          entity: 'User',
          recordId: 'user-2',
          userId: 'user-2',
        })
      );
      expect(auditLog.record).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditLogAction.update })
      );
    });

    it('writes a refused sign-in to the audit log with the reason', async () => {
      process.env['APP_ENVIRONMENT'] = 'staging';

      await expect(
        service.createSession('code-1', 'verifier-1')
      ).rejects.toThrow();

      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          mutation: 'createSessionWithWepublishLogin',
          entity: 'Session',
          userId: null,
          userEmail: 'Jane@WePublish.ch',
          success: false,
          errorMessage: expect.stringMatching(/login-cms-admin-staging/),
        })
      );
    });
  });
});
