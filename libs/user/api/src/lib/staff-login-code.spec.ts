import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  AuthenticationService,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import { LoginCodeService } from '@wepublish/login-code/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';
import { UserRoleDataloader } from './user-role.dataloader';
import { UserRoleService } from './user-role.service';
import { UserService } from './user.service';

// Staff never hold a login code. Becoming staff happens in two places — a
// person is given a role, or a role is given more permissions — and both
// revoke the codes right away, instead of when one is next used.
describe('login codes of people who become staff', () => {
  const loginCodes = {
    revokeIfStaff: vi.fn().mockResolvedValue(undefined),
    revokeForRole: vi.fn().mockResolvedValue(undefined),
  };
  const prisma = {
    user: {
      update: vi.fn().mockResolvedValue({ id: 'user-1' }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    userRole: {
      update: vi.fn().mockResolvedValue({ id: 'moderator' }),
    },
  };
  const shared = [
    { provide: PrismaClient, useValue: prisma },
    { provide: LoginCodeService, useValue: loginCodes },
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

  it('revokes them once the roles of a person were saved', async () => {
    await (await users()).updateUser({ id: 'user-1', roleIDs: ['editor'] });

    expect(loginCodes.revokeIfStaff).toHaveBeenCalledWith('user-1');
    expect(prisma.user.update.mock.invocationCallOrder[0]).toBeLessThan(
      loginCodes.revokeIfStaff.mock.invocationCallOrder[0]
    );
  });

  it('leaves them alone when the roles of a person did not change', async () => {
    await (await users()).updateUser({ id: 'user-1', note: 'Telefoniert' });

    expect(loginCodes.revokeIfStaff).not.toHaveBeenCalled();
  });

  it('revokes them for everyone holding a role once its permissions were saved', async () => {
    await (
      await roles()
    ).updateUserRole({
      id: 'moderator',
      permissionIDs: ['CAN_TAKE_COMMENT_ACTION'],
    });

    expect(loginCodes.revokeForRole).toHaveBeenCalledWith('moderator');
    expect(prisma.userRole.update.mock.invocationCallOrder[0]).toBeLessThan(
      loginCodes.revokeForRole.mock.invocationCallOrder[0]
    );
  });

  it('leaves them alone when only the name of a role changed', async () => {
    await (
      await roles()
    ).updateUserRole({ id: 'moderator', name: 'Moderation' });

    expect(loginCodes.revokeForRole).not.toHaveBeenCalled();
  });
});
