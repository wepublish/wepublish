import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  AuthenticationService,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { UserService } from './user.service';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';

const user = {
  id: 'user-1',
  email: 'old@example.com',
  pendingEmail: 'new@example.com',
  // Past the request cooldown, within the confirmation window.
  pendingEmailAt: new Date(Date.now() - 10 * 60 * 1000),
};

describe('UserService session cache', () => {
  let service: UserService;
  let sessionCache: { invalidate: Mock };
  let sessions: { deleteMany: Mock };

  beforeEach(async () => {
    sessionCache = { invalidate: vi.fn().mockResolvedValue(undefined) };
    sessions = { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaClient,
          useValue: {
            user: {
              update: vi.fn().mockResolvedValue(user),
              delete: vi.fn().mockResolvedValue(user),
              findUnique: vi.fn().mockResolvedValue(user),
              findFirst: vi.fn().mockResolvedValue(null),
            },
            session: sessions,
            comment: { findMany: vi.fn().mockResolvedValue([]) },
          },
        },
        {
          provide: MailContext,
          useValue: {
            getUserTemplateId: vi.fn().mockResolvedValue('template-1'),
            sendMail: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: HibpService,
          useValue: { isPasswordPwned: vi.fn().mockResolvedValue(false) },
        },
        {
          provide: MailchimpContactService,
          useValue: {
            updateContactEmail: vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: UserDataloaderService, useValue: { prime: vi.fn() } },
        {
          provide: AuthenticationService,
          useValue: {
            revokeUserSessions: vi.fn().mockResolvedValue(0),
            isPlaceholderEmail: vi.fn().mockResolvedValue(false),
          },
        },
        { provide: SessionCacheInvalidator, useValue: sessionCache },
        {
          provide: PublicContentCacheInvalidator,
          useValue: { invalidateComments: vi.fn() },
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  it.each([
    [
      'updating a user',
      () => service.updateUser({ id: 'user-1', name: 'New' }),
    ],
    ['deleting a user', () => service.deleteUser('user-1')],
    [
      'changing a password',
      () => service.updateUserPassword('user-1', 'a-new-Password-123'),
    ],
    ['resetting a password', () => service.resetPassword('user-1')],
    [
      'requesting an email change',
      () => service.requestEmailChange('user-1', 'new@example.com'),
    ],
    [
      'confirming an email change',
      () => service.confirmEmailChange('user-1', 'new@example.com'),
    ],
  ])('clears cached sessions after %s', async (_, change) => {
    await change();

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  describe('after a password change', () => {
    it('ends the other sessions of a user who changed their own password, keeping the one they did it in', async () => {
      await service.updateUserPassword('user-1', 'a-new-Password-123', {
        keepSessionId: 'session-1',
      });

      expect(sessions.deleteMany).toHaveBeenCalledWith({
        where: { userID: 'user-1', id: { not: 'session-1' } },
      });
    });

    it('ends every session of a user who reset the password with a link', async () => {
      await service.updateUserPassword('user-1', 'a-new-Password-123');

      expect(sessions.deleteMany).toHaveBeenCalledWith({
        where: { userID: 'user-1' },
      });
    });

    it('ends every session of a user whose password an editor reset', async () => {
      await service.resetPassword('user-1');

      expect(sessions.deleteMany).toHaveBeenCalledWith({
        where: { userID: 'user-1' },
      });
    });

    it('ends the sessions before clearing the session cache, so no replica serves them again', async () => {
      await service.updateUserPassword('user-1', 'a-new-Password-123');

      expect(sessions.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
        sessionCache.invalidate.mock.invocationCallOrder[0]
      );
    });
  });
});
