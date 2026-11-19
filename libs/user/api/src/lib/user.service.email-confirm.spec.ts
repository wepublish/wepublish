import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  AuthenticationService,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { UserService } from './user.service';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';

const pending = (email: string, pendingEmail: string) => ({
  id: 'user-1',
  email,
  pendingEmail,
  pendingEmailAt: new Date(Date.now() - 10 * 60 * 1000),
});

const createService = async (user: ReturnType<typeof pending>) => {
  const revokeUserSessions = vi.fn().mockResolvedValue(0);
  const module = await Test.createTestingModule({
    providers: [
      UserService,
      {
        provide: PrismaClient,
        useValue: {
          user: {
            findUnique: vi.fn().mockResolvedValue(user),
            update: vi
              .fn()
              .mockResolvedValue({ ...user, email: user.pendingEmail }),
          },
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

  return { service: module.get(UserService), revokeUserSessions };
};

describe('UserService confirmEmailChange', () => {
  it('ends the other sessions once the address really changed', async () => {
    const { service, revokeUserSessions } = await createService(
      pending('old@example.com', 'new@example.com')
    );

    await service.confirmEmailChange('token', { exceptSessionToken: 'mine' });

    expect(revokeUserSessions).toHaveBeenCalledWith('user-1', {
      exceptToken: 'mine',
    });
  });

  // Confirming the address on file proves the inbox is the reader's own; no
  // one else gained anything that would need ending, and the session waiting
  // on the welcome page must stay alive.
  it('keeps all sessions when the address on file was only confirmed', async () => {
    const { service, revokeUserSessions } = await createService(
      pending('reader@example.com', 'reader@example.com')
    );

    await service.confirmEmailChange('token');

    expect(revokeUserSessions).not.toHaveBeenCalled();
  });
});
