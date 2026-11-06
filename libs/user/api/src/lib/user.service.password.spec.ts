import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { UserService } from './user.service';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';

describe('UserService password lookup', () => {
  it('asks for the password hash, which every other user query leaves out', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaClient, useValue: { user: { findFirst } } },
        { provide: MailContext, useValue: {} },
        { provide: HibpService, useValue: {} },
        { provide: MailchimpContactService, useValue: {} },
        { provide: UserDataloaderService, useValue: { prime: vi.fn() } },
        { provide: SessionCacheInvalidator, useValue: {} },
        { provide: PublicContentCacheInvalidator, useValue: {} },
      ],
    }).compile();

    await module
      .get(UserService)
      .getUserByEmailWithPassword('jane@example.com');

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ omit: { password: false } })
    );
  });
});
