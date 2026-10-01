import { Test } from '@nestjs/testing';
import { PrismaClient, User } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { ImageUploadService } from '@wepublish/image/api';
import { UserRoleService } from './user-role.service';
import { UserRoleDataloader } from './user-role.dataloader';
import { ProfileService } from './profile.service';

const prisma = {
  userRole: {
    update: jest.fn().mockResolvedValue({ id: 'editor' }),
    delete: jest.fn().mockResolvedValue({ id: 'editor' }),
  },
  user: {
    update: jest.fn().mockResolvedValue({ id: 'user-1' }),
  },
} as unknown as PrismaClient;

describe('session cache after role and profile changes', () => {
  let sessionCache: { invalidate: jest.Mock };

  beforeEach(() => {
    sessionCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
  });

  const roles = async () =>
    (
      await Test.createTestingModule({
        providers: [
          UserRoleService,
          { provide: PrismaClient, useValue: prisma },
          { provide: SessionCacheInvalidator, useValue: sessionCache },
          { provide: UserRoleDataloader, useValue: { prime: jest.fn() } },
        ],
      }).compile()
    ).get(UserRoleService);

  it('clears cached sessions after a role is changed', async () => {
    await (await roles()).updateUserRole({ id: 'editor', name: 'Editor' });

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  it('clears cached sessions after a role is deleted', async () => {
    await (await roles()).deleteUserRole('editor');

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  it('clears cached sessions after a profile image is changed', async () => {
    const profile = new ProfileService(
      prisma,
      {} as ImageUploadService,
      sessionCache as unknown as SessionCacheInvalidator
    );

    await profile.uploadUserProfileImage(
      { id: 'user-1', userImageID: null } as User,
      undefined as never
    );

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });
});
