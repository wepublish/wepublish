import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { UserService } from './user.service';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';

const user = {
  id: 'user-1',
  email: 'old@example.com',
  pendingEmail: 'new@example.com',
  pendingEmailAt: new Date(),
};

describe('UserService session cache', () => {
  let service: UserService;
  let sessionCache: { invalidate: jest.Mock };
  let sessions: { deleteMany: jest.Mock };

  beforeEach(async () => {
    sessionCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    sessions = { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaClient,
          useValue: {
            user: {
              update: jest.fn().mockResolvedValue(user),
              delete: jest.fn().mockResolvedValue(user),
              findUnique: jest.fn().mockResolvedValue(user),
              findFirst: jest.fn().mockResolvedValue(null),
            },
            session: sessions,
            comment: { findMany: jest.fn().mockResolvedValue([]) },
          },
        },
        {
          provide: MailContext,
          useValue: {
            getUserTemplateId: jest.fn().mockResolvedValue('template-1'),
            sendMail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: HibpService,
          useValue: { isPasswordPwned: jest.fn().mockResolvedValue(false) },
        },
        {
          provide: MailchimpContactService,
          useValue: {
            updateContactEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: UserDataloaderService, useValue: { prime: jest.fn() } },
        { provide: SessionCacheInvalidator, useValue: sessionCache },
        {
          provide: PublicContentCacheInvalidator,
          useValue: { invalidateComments: jest.fn() },
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
