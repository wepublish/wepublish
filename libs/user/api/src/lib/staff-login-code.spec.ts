import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  AuthenticationService,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';
import { UserRoleDataloader } from './user-role.dataloader';
import { UserRoleService } from './user-role.service';
import { UserService } from './user.service';

// Staff never log in with a login code, but becoming staff leaves a code in
// place: revoking it on saving a role would be an unexpected side effect. The
// editor shows the conflict, and the code is refused and revoked when used.
describe('login codes of people who become staff', () => {
  const prisma = {
    user: {
      update: vi.fn().mockResolvedValue({ id: 'user-1' }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    userRole: {
      update: vi.fn().mockResolvedValue({ id: 'moderator' }),
    },
    userLoginCode: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  const shared = [
    { provide: PrismaClient, useValue: prisma },
    { provide: SessionCacheInvalidator, useValue: { invalidate: vi.fn() } },
  ];

  beforeEach(() => vi.clearAllMocks());

  const users = async () =>
    (
      await Test.createTestingModule({
        providers: [
          ...shared,
          UserService,
          { provide: MailContext, useValue: {} },
          { provide: HibpService, useValue: {} },
          { provide: MailchimpContactService, useValue: {} },
          { provide: AuthenticationService, useValue: {} },
          { provide: PublicContentCacheInvalidator, useValue: {} },
          { provide: UserDataloaderService, useValue: { prime: vi.fn() } },
        ],
      }).compile()
    ).get(UserService);

  const roles = async () =>
    (
      await Test.createTestingModule({
        providers: [
          ...shared,
          UserRoleService,
          { provide: UserRoleDataloader, useValue: { prime: vi.fn() } },
        ],
      }).compile()
    ).get(UserRoleService);

  it('keeps them when a person is given a staff role', async () => {
    await (await users()).updateUser({ id: 'user-1', roleIDs: ['editor'] });

    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.userLoginCode.update).not.toHaveBeenCalled();
    expect(prisma.userLoginCode.updateMany).not.toHaveBeenCalled();
  });

  it('keeps them when a role they hold is given staff permissions', async () => {
    await (
      await roles()
    ).updateUserRole({
      id: 'moderator',
      permissionIDs: ['CAN_TAKE_COMMENT_ACTION'],
    });

    expect(prisma.userRole.update).toHaveBeenCalled();
    expect(prisma.userLoginCode.update).not.toHaveBeenCalled();
    expect(prisma.userLoginCode.updateMany).not.toHaveBeenCalled();
  });
});
