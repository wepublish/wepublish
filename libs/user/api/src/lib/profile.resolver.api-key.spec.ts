import { ForbiddenException } from '@nestjs/common';
import { AuthSessionType } from '@wepublish/authentication/api';

import { ProfileResolver } from './profile.resolver';
import { SensitiveDataUserResolver } from './sensitive-data-user.resolver';

const creator = {
  id: 'user-1',
  email: 'editor@example.com',
  roleIDs: ['admin'],
};

const keySession = {
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Print Import',
  token: 'wep_secret',
  permissions: ['CAN_GET_EVENT'],
  organizationId: null,
  user: creator,
} as never;

const setup = () => {
  const userService = {
    validatePassword: vi.fn().mockResolvedValue(undefined),
    updateUserPassword: vi.fn().mockResolvedValue(creator),
    requestEmailChange: vi.fn().mockResolvedValue(creator),
    confirmEmailChange: vi.fn().mockResolvedValue(creator),
    updateUser: vi.fn().mockResolvedValue(creator),
  };
  const profileService = {
    uploadUserProfileImage: vi.fn().mockResolvedValue(creator),
  };

  return {
    userService,
    profileService,
    resolver: new ProfileResolver(
      userService as never,
      profileService as never
    ),
  };
};

describe('ProfileResolver for an api key acting as its creator', () => {
  it('answers me with the creator', async () => {
    expect(await setup().resolver.me(keySession)).toBe(creator);
  });

  it('lets the key change the creator profile image', async () => {
    const { resolver, profileService } = setup();

    await resolver.uploadUserProfileImage({} as never, keySession);

    expect(profileService.uploadUserProfileImage).toHaveBeenCalledWith(
      creator,
      {}
    );
  });

  it('refuses to change the creator password', async () => {
    const { resolver, userService } = setup();

    await expect(
      resolver.updatePassword(
        'a-new-Password-123',
        'a-new-Password-123',
        keySession
      )
    ).rejects.toThrow(ForbiddenException);
    expect(userService.updateUserPassword).not.toHaveBeenCalled();
  });

  it('refuses to change the creator email address', async () => {
    const { resolver, userService } = setup();

    await expect(
      resolver.requestEmailChange('new@example.com', keySession)
    ).rejects.toThrow(ForbiddenException);
    await expect(
      resolver.confirmEmailChange('new@example.com', keySession)
    ).rejects.toThrow(ForbiddenException);
    expect(userService.requestEmailChange).not.toHaveBeenCalled();
    expect(userService.confirmEmailChange).not.toHaveBeenCalled();
  });
});

describe('SensitiveDataUserResolver permissions', () => {
  const resolver = new SensitiveDataUserResolver(
    {} as never,
    {} as never,
    {} as never,
    {} as never
  );

  it('reports the key scopes on its creator, never the creator roles', async () => {
    expect(
      await resolver.permissions(keySession, { id: 'user-1' } as never)
    ).toEqual(['CAN_GET_EVENT']);
  });

  it('reports the roles of a signed-in user on themselves', async () => {
    expect(
      await resolver.permissions(
        {
          type: AuthSessionType.User,
          user: { id: 'user-1' },
          roles: [{ id: 'editor', permissionIDs: ['CAN_GET_ARTICLE'] }],
        } as never,
        { id: 'user-1' } as never
      )
    ).toEqual(['CAN_GET_ARTICLE']);
  });

  it('reports nothing about somebody else', async () => {
    expect(
      await resolver.permissions(keySession, { id: 'user-2' } as never)
    ).toEqual([]);
  });
});
