import type { Mock } from 'vitest';
import { ManagedByWepublishLoginError } from './managed-by-wepublish-login';
import { ProfileResolver } from './profile.resolver';
import { SensitiveDataUserResolver } from './sensitive-data-user.resolver';
import { UserResolver } from './user.resolver';

const managed = {
  id: 'user-1',
  email: 'jane@wepublish.ch',
  wepublishLoginSubject: 'zitadel-1',
};
const ordinary = { ...managed, id: 'user-2', wepublishLoginSubject: null };

describe('accounts managed by the We.Publish login', () => {
  let service: Record<string, Mock>;
  let dataloader: { load: Mock };
  let users: UserResolver;

  beforeEach(() => {
    service = {
      updateUser: vi.fn().mockResolvedValue({}),
      resetPassword: vi.fn().mockResolvedValue({}),
      deleteUser: vi.fn().mockResolvedValue({}),
      validatePassword: vi.fn().mockResolvedValue(undefined),
      updateUserPassword: vi.fn().mockResolvedValue({}),
      requestEmailChange: vi.fn().mockResolvedValue(undefined),
      confirmEmailChange: vi.fn().mockResolvedValue({}),
    };
    dataloader = {
      load: vi.fn(async (id: string) => (id === 'user-1' ? managed : ordinary)),
    };
    users = new UserResolver(
      service as never,
      dataloader as never,
      {} as never
    );
  });

  describe('in the editor', () => {
    it('refuses to update one', async () => {
      await expect(
        users.updateUser({ id: 'user-1', name: 'Smith' } as never)
      ).rejects.toBeInstanceOf(ManagedByWepublishLoginError);
      expect(service['updateUser']).not.toHaveBeenCalled();
    });

    it('still updates every other account', async () => {
      await users.updateUser({ id: 'user-2', name: 'Smith' } as never);

      expect(service['updateUser']).toHaveBeenCalledWith({
        id: 'user-2',
        name: 'Smith',
      });
    });

    it('refuses to reset the password of one', async () => {
      await expect(
        users.resetPassword('user-1', 'a-new-Password-123')
      ).rejects.toBeInstanceOf(ManagedByWepublishLoginError);
      expect(service['resetPassword']).not.toHaveBeenCalled();
    });

    it('refuses to delete one', async () => {
      await expect(users.deleteUser('user-1')).rejects.toBeInstanceOf(
        ManagedByWepublishLoginError
      );
      expect(service['deleteUser']).not.toHaveBeenCalled();
    });

    it('still deletes every other account', async () => {
      await users.deleteUser('user-2');

      expect(service['deleteUser']).toHaveBeenCalledWith('user-2');
    });

    it('tells the editor which accounts it may not change', () => {
      const resolver = new SensitiveDataUserResolver(
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never
      );

      expect(resolver.managedByWepublishLogin(managed as never)).toBe(true);
      expect(resolver.managedByWepublishLogin(ordinary as never)).toBe(false);
    });
  });

  describe('for the person themselves', () => {
    const session = { id: 'session-1', user: managed } as never;
    let profile: ProfileResolver;

    beforeEach(() => {
      profile = new ProfileResolver(
        service as never,
        {
          uploadUserProfileImage: vi.fn(),
        } as never
      );
    });

    it('refuses to update the own profile', async () => {
      await expect(
        users.updateCurrentUser({ name: 'Smith' } as never, session)
      ).rejects.toBeInstanceOf(ManagedByWepublishLoginError);
      expect(service['updateUser']).not.toHaveBeenCalled();
    });

    it('refuses to change the own password', async () => {
      await expect(
        profile.updatePassword(
          'a-new-Password-123',
          'a-new-Password-123',
          session
        )
      ).rejects.toBeInstanceOf(ManagedByWepublishLoginError);
      expect(service['updateUserPassword']).not.toHaveBeenCalled();
    });

    it('refuses to change the own profile image', async () => {
      await expect(
        profile.uploadUserProfileImage({} as never, session)
      ).rejects.toBeInstanceOf(ManagedByWepublishLoginError);
    });

    it('refuses to change the own email address', async () => {
      await expect(
        profile.requestEmailChange('new@wepublish.ch', session)
      ).rejects.toBeInstanceOf(ManagedByWepublishLoginError);
      await expect(
        profile.confirmEmailChange('new@wepublish.ch', session)
      ).rejects.toBeInstanceOf(ManagedByWepublishLoginError);
      expect(service['requestEmailChange']).not.toHaveBeenCalled();
      expect(service['confirmEmailChange']).not.toHaveBeenCalled();
    });

    it('still lets every other account update its own profile', async () => {
      await users.updateCurrentUser(
        { name: 'Smith' } as never,
        { id: 'session-2', user: ordinary } as never
      );

      expect(service['updateUser']).toHaveBeenCalledWith({
        name: 'Smith',
        id: 'user-2',
      });
    });
  });
});
