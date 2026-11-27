import { Test } from '@nestjs/testing';
import { PrismaClient, SessionOrigin } from '@prisma/client';
import {
  AuthenticationService,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { UserService } from './user.service';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';

const pending = (
  email: string,
  pendingEmail: string,
  pendingEmailSessionId: string | null = 'asking'
) => ({
  id: 'user-1',
  email,
  pendingEmail,
  pendingEmailAt: new Date(Date.now() - 10 * 60 * 1000),
  pendingEmailSessionId,
});

const createService = async (user: ReturnType<typeof pending>) => {
  const revokeUserSessions = vi.fn().mockResolvedValue(0);
  const confirmSession = vi.fn().mockResolvedValue({ count: 1 });
  const updateUser = vi
    .fn()
    .mockResolvedValue({ ...user, email: user.pendingEmail });
  const module = await Test.createTestingModule({
    providers: [
      UserService,
      {
        provide: PrismaClient,
        useValue: {
          user: {
            findUnique: vi.fn().mockResolvedValue(user),
            update: updateUser,
          },
          session: { updateMany: confirmSession },
        },
      },
      { provide: MailContext, useValue: {} },
      { provide: HibpService, useValue: {} },
      {
        provide: MailchimpContactService,
        useValue: { updateContactEmail: vi.fn() },
      },
      { provide: UserDataloaderService, useValue: { prime: vi.fn() } },
      { provide: AuthenticationService, useValue: { revokeUserSessions } },
      {
        provide: SessionCacheInvalidator,
        useValue: { invalidate: vi.fn() },
      },
      {
        provide: PublicContentCacheInvalidator,
        useValue: { invalidateComments: vi.fn() },
      },
    ],
  }).compile();

  return {
    service: module.get(UserService),
    revokeUserSessions,
    confirmSession,
    updateUser,
  };
};

const codeSession = (id: string, userId = 'user-1') => ({
  id,
  userId,
  origin: SessionOrigin.purl,
});

describe('UserService confirmEmailChange', () => {
  describe('the address on file was confirmed', () => {
    const sameAddress = () =>
      pending('reader@example.com', 'reader@example.com');

    // Whoever else redeemed the code learns nothing from the confirmation:
    // only the session that asked and opened the link itself is freed.
    it('frees the session that asked and ends the other login-code sessions', async () => {
      const { service, revokeUserSessions, confirmSession, updateUser } =
        await createService(sameAddress());

      await service.confirmEmailChange('token', {
        session: codeSession('asking'),
      });

      expect(confirmSession).toHaveBeenCalledWith({
        where: { id: 'asking', userID: 'user-1' },
        data: { emailConfirmedAt: expect.any(Date) },
      });
      expect(revokeUserSessions).toHaveBeenCalledWith('user-1', {
        exceptSessionId: 'asking',
        origin: SessionOrigin.purl,
      });
      expect(updateUser.mock.calls[0][0].data).toMatchObject({
        emailVerifiedAt: expect.any(Date),
        pendingEmailSessionId: null,
      });
    });

    it.each([
      ['in a browser without a session', undefined],
      ['by another login-code session', codeSession('someone-else')],
    ])(
      'frees no session when the link is opened %s',
      async (_name, session) => {
        const { service, revokeUserSessions, confirmSession, updateUser } =
          await createService(sameAddress());

        await service.confirmEmailChange('token', { session });

        expect(confirmSession).not.toHaveBeenCalled();
        expect(revokeUserSessions).toHaveBeenCalledWith('user-1', {
          exceptSessionId: undefined,
          origin: SessionOrigin.purl,
        });
        expect(updateUser.mock.calls[0][0].data).toMatchObject({
          emailVerifiedAt: expect.any(Date),
        });
      }
    );

    it('keeps a password session that opens the link signed in', async () => {
      const { service, revokeUserSessions, confirmSession } =
        await createService(sameAddress());

      await service.confirmEmailChange('token', {
        session: {
          id: 'password',
          userId: 'user-1',
          origin: SessionOrigin.password,
        },
      });

      expect(confirmSession).not.toHaveBeenCalled();
      expect(revokeUserSessions).toHaveBeenCalledWith('user-1', {
        exceptSessionId: 'password',
        origin: SessionOrigin.purl,
      });
    });

    it('does nothing for the session of another account', async () => {
      const { service, revokeUserSessions, confirmSession } =
        await createService(sameAddress());

      await service.confirmEmailChange('token', {
        session: codeSession('asking', 'user-2'),
      });

      expect(confirmSession).not.toHaveBeenCalled();
      expect(revokeUserSessions).toHaveBeenCalledWith('user-1', {
        exceptSessionId: undefined,
        origin: SessionOrigin.purl,
      });
    });
  });

  describe('the address changed', () => {
    const newAddress = () => pending('old@example.com', 'new@example.com');

    it('ends every other session, whatever its login', async () => {
      const { service, revokeUserSessions, confirmSession } =
        await createService(newAddress());

      await service.confirmEmailChange('token', {
        session: codeSession('asking'),
      });

      expect(confirmSession).toHaveBeenCalled();
      expect(revokeUserSessions).toHaveBeenCalledWith('user-1', {
        exceptSessionId: 'asking',
      });
    });

    it('ends every session when the link is opened elsewhere', async () => {
      const { service, revokeUserSessions } = await createService(newAddress());

      await service.confirmEmailChange('token');

      expect(revokeUserSessions).toHaveBeenCalledWith('user-1', {
        exceptSessionId: undefined,
      });
    });
  });
});
