import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaClient, User } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { ImageUploadService } from '@wepublish/image/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { UserRoleService } from './user-role.service';
import { UserRoleDataloader } from './user-role.dataloader';
import { ProfileService } from './profile.service';

const prisma = {
  userRole: {
    update: vi.fn().mockResolvedValue({ id: 'editor' }),
    delete: vi.fn().mockResolvedValue({ id: 'editor' }),
  },
  user: {
    update: vi.fn().mockResolvedValue({ id: 'user-1' }),
  },
} as unknown as PrismaClient;

const publicContentCache = {
  invalidateComments: vi.fn().mockResolvedValue(undefined),
} as unknown as PublicContentCacheInvalidator;

describe('session cache after role and profile changes', () => {
  let sessionCache: { invalidate: Mock };

  beforeEach(() => {
    sessionCache = { invalidate: vi.fn().mockResolvedValue(undefined) };
  });

  const roles = async () =>
    (
      await Test.createTestingModule({
        providers: [
          UserRoleService,
          { provide: PrismaClient, useValue: prisma },
          { provide: SessionCacheInvalidator, useValue: sessionCache },
          { provide: UserRoleDataloader, useValue: { prime: vi.fn() } },
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
      sessionCache as unknown as SessionCacheInvalidator,
      publicContentCache
    );

    await profile.uploadUserProfileImage(
      { id: 'user-1', userImageID: null } as User,
      undefined as never
    );

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  it.each([
    ['replaced', { id: 'user-1', userImageID: 'image-1' }, {}],
    ['removed', { id: 'user-1', userImageID: 'image-1' }, null],
  ])(
    'treats a %s profile image as a profile image, so it does not rebuild public content',
    async (_, user, upload) => {
      const imageService = {
        replaceImage: vi.fn().mockResolvedValue({ id: 'image-2' }),
        uploadImage: vi.fn().mockResolvedValue({ id: 'image-2' }),
        deleteImage: vi.fn().mockResolvedValue('image-1'),
      };
      const profile = new ProfileService(
        prisma,
        imageService as unknown as ImageUploadService,
        sessionCache as unknown as SessionCacheInvalidator,
        publicContentCache
      );

      await profile.uploadUserProfileImage(user as User, upload as never);

      for (const call of [
        ...imageService.replaceImage.mock.calls,
        ...imageService.deleteImage.mock.calls,
      ]) {
        expect(call.at(-1)).toEqual({ profileImage: true });
      }
      expect(
        imageService.replaceImage.mock.calls.length +
          imageService.deleteImage.mock.calls.length
      ).toBeGreaterThan(0);
    }
  );
});
