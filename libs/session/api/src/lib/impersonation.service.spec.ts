import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogAction, AuditLogActorType } from '@prisma/client';
import { AuthSessionType } from '@wepublish/authentication/api';
import type { Mock } from 'vitest';
import { ImpersonationService } from './impersonation.service';

const staff = {
  type: AuthSessionType.User,
  id: 'session-1',
  token: 'token-1',
  createdAt: new Date(),
  expiresAt: new Date('2030-01-01T00:00:00.000Z'),
  canImpersonate: true,
  impersonatedBy: null,
  roles: [],
  user: { id: 'user-1', email: 'jane@wepublish.ch' },
};

const reader = {
  id: 'user-2',
  email: 'reader@example.com',
  active: true,
  wepublishLoginSubject: null,
};

describe('ImpersonationService', () => {
  let prisma: {
    user: { findUnique: Mock };
    session: { findUnique: Mock };
    impersonationGrant: { create: Mock };
  };
  let sessionService: { createUserSession: Mock };
  let jwtService: { generateImpersonationGrant: Mock };
  let auditLog: { record: Mock };
  let service: ImpersonationService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(reader) },
      session: {
        findUnique: vi.fn().mockResolvedValue({
          impersonationReason: 'Ticket 4711',
          expiresAt: new Date(Date.now() + 25 * 60 * 1000 + 30 * 1000),
        }),
      },
      impersonationGrant: { create: vi.fn().mockResolvedValue({}) },
    };
    sessionService = {
      createUserSession: vi.fn().mockImplementation(async user => ({
        user,
        token: 'token-2',
        sessionId: 'session-2',
        impersonated: true,
      })),
    };
    jwtService = {
      generateImpersonationGrant: vi.fn().mockResolvedValue('grant-jwt'),
    };
    auditLog = { record: vi.fn() };

    service = new ImpersonationService(
      prisma as never,
      sessionService as never,
      jwtService as never,
      auditLog as never,
      'https://www.medium.ch'
    );
  });

  describe('currentSession', () => {
    it('tells whether the session may impersonate or is an impersonation', () => {
      expect(service.currentSession(staff as never)).toEqual({
        canImpersonate: true,
        impersonatedBy: null,
        expiresAt: staff.expiresAt,
      });
      expect(
        service.currentSession({
          ...staff,
          canImpersonate: false,
          impersonatedBy: 'jane@wepublish.ch',
        } as never)
      ).toMatchObject({
        canImpersonate: false,
        impersonatedBy: 'jane@wepublish.ch',
      });
    });

    it('has nothing to say about a token', () => {
      expect(
        service.currentSession({
          type: AuthSessionType.Token,
          id: 'token',
        } as never)
      ).toEqual({
        canImpersonate: false,
        impersonatedBy: null,
        expiresAt: null,
      });
    });
  });

  describe('impersonateInEditor', () => {
    it('signs in as the user for an hour, naming the supporter and the reason', async () => {
      const session = await service.impersonateInEditor(
        staff as never,
        'user-2',
        '  Ticket 4711  '
      );

      expect(sessionService.createUserSession).toHaveBeenCalledWith(reader, {
        ttlMs: 60 * 60 * 1000,
        impersonatedBy: 'jane@wepublish.ch',
        impersonationReason: 'Ticket 4711',
      });
      expect(session.token).toBe('token-2');
    });

    it('writes the impersonation to the audit log', async () => {
      await service.impersonateInEditor(
        staff as never,
        'user-2',
        'Ticket 4711'
      );

      expect(auditLog.record).toHaveBeenCalledWith({
        mutation: 'impersonateUser',
        action: AuditLogAction.other,
        entity: 'Session',
        recordId: 'session-2',
        actorType: AuditLogActorType.user,
        userId: 'user-2',
        userEmail: 'reader@example.com',
        sessionId: 'session-2',
        impersonatedBy: 'jane@wepublish.ch',
        success: true,
        errorMessage: null,
      });
    });
  });

  describe('impersonateOnWebsite', () => {
    it('hands out a single-use grant for the website', async () => {
      const result = await service.impersonateOnWebsite(
        staff as never,
        'user-2',
        'Ticket 4711'
      );

      const [{ data }] = prisma.impersonationGrant.create.mock.calls[0];
      expect(data.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
        60 * 1000
      );
      expect(jwtService.generateImpersonationGrant).toHaveBeenCalledWith({
        userId: 'user-2',
        durationMinutes: 60,
        impersonatedBy: 'jane@wepublish.ch',
        reason: 'Ticket 4711',
        jti: data.jti,
      });
      expect(result).toEqual({
        token: 'grant-jwt',
        url: 'https://www.medium.ch',
      });
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          mutation: 'createWebsiteImpersonation',
          entity: 'User',
          recordId: 'user-2',
          userId: 'user-2',
          impersonatedBy: 'jane@wepublish.ch',
        })
      );
    });
  });

  describe('continueOnWebsite', () => {
    const impersonated = {
      ...staff,
      id: 'session-2',
      canImpersonate: false,
      impersonatedBy: 'jane@wepublish.ch',
      user: { id: 'user-2', email: 'reader@example.com' },
    };

    it('hands the website a grant for the same impersonation and the time left', async () => {
      const result = await service.continueOnWebsite(impersonated as never);

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-2' },
        select: { impersonationReason: true, expiresAt: true },
      });
      const [{ data }] = prisma.impersonationGrant.create.mock.calls[0];
      expect(jwtService.generateImpersonationGrant).toHaveBeenCalledWith({
        userId: 'user-2',
        durationMinutes: 25,
        impersonatedBy: 'jane@wepublish.ch',
        reason: 'Ticket 4711',
        jti: data.jti,
      });
      expect(result.token).toBe('grant-jwt');
      expect(result.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
        60 * 1000
      );
    });

    it('never grants less than a minute', async () => {
      prisma.session.findUnique.mockResolvedValue({
        impersonationReason: 'Ticket 4711',
        expiresAt: new Date(Date.now() + 10 * 1000),
      });

      await service.continueOnWebsite(impersonated as never);

      expect(jwtService.generateImpersonationGrant).toHaveBeenCalledWith(
        expect.objectContaining({ durationMinutes: 1 })
      );
    });
  });

  describe.each([
    ['impersonateInEditor' as const],
    ['impersonateOnWebsite' as const],
  ])('%s refuses', method => {
    const run = (session: unknown, reason = 'Ticket 4711', userId = 'user-2') =>
      service[method](session as never, userId, reason);

    afterEach(() => {
      expect(sessionService.createUserSession).not.toHaveBeenCalled();
      expect(jwtService.generateImpersonationGrant).not.toHaveBeenCalled();
    });

    it('a session without the impersonate-cms role', async () => {
      await expect(
        run({ ...staff, canImpersonate: false })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('an impersonated session, even one that could impersonate', async () => {
      await expect(
        run({ ...staff, impersonatedBy: 'someone@wepublish.ch' })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('a token', async () => {
      await expect(
        run({ type: AuthSessionType.Token, id: 'token' })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('without a real reason', async () => {
      await expect(run(staff, ' x ')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('an unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(run(staff)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('an inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...reader, active: false });

      await expect(run(staff)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('another We.Publish account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...reader,
        wepublishLoginSubject: 'zitadel-2',
      });

      await expect(run(staff)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('the own account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...reader,
        id: 'user-1',
      });

      await expect(run(staff, 'Ticket 4711', 'user-1')).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });
  });
});
