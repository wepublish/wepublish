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
  pendingEmailAt: new Date(),
};

describe('UserService email quality', () => {
  let service: UserService;
  let recorder: { recompute: Mock };
  let update: Mock;

  beforeEach(async () => {
    recorder = { recompute: vi.fn().mockResolvedValue(undefined) };
    update = vi.fn().mockResolvedValue({ ...user, email: 'new@example.com' });

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaClient,
          useValue: {
            user: {
              update,
              findUnique: vi.fn().mockResolvedValue(user),
              findFirst: vi.fn().mockResolvedValue(null),
            },
            comment: { findMany: vi.fn().mockResolvedValue([]) },
          },
        },
        {
          provide: MailContext,
          useValue: { emailQualityRecorder: recorder },
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
        {
          provide: SessionCacheInvalidator,
          useValue: { invalidate: vi.fn().mockResolvedValue(undefined) },
        },
        {
          provide: PublicContentCacheInvalidator,
          useValue: { invalidateComments: vi.fn() },
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  // The level belongs to an address. After a change the old evidence no
  // longer applies, so the level is derived again right away instead of
  // waiting for the nightly run.
  it('re-evaluates the level when an editor changes the address', async () => {
    await service.updateUser({ id: 'user-1', email: 'New@Example.com' });

    expect(recorder.recompute).toHaveBeenCalledWith('user-1');
  });

  it('leaves the level alone when the address stays', async () => {
    await service.updateUser({ id: 'user-1', name: 'Jane' });

    expect(recorder.recompute).not.toHaveBeenCalled();
  });

  it('re-evaluates the level when the user confirms a new address', async () => {
    await service.confirmEmailChange('user-1', 'new@example.com');

    expect(recorder.recompute).toHaveBeenCalledWith('user-1');
  });

  it('does not fail the change when the evaluation fails', async () => {
    recorder.recompute.mockRejectedValue(new Error('db down'));

    await expect(
      service.confirmEmailChange('user-1', 'new@example.com')
    ).resolves.toMatchObject({ email: 'new@example.com' });
  });
});
