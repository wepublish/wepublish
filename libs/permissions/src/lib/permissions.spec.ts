import {
  AllPermissions,
  CanCreateApiToken,
  CanGetAllApiTokens,
  CanGetApiTokens,
  CanRevokeAllApiTokens,
  CanRevokeApiToken,
  EditorPermissions,
} from './permissions';

describe('EditorPermissions', () => {
  it('lets editors manage their own API keys', () => {
    expect(EditorPermissions).toEqual(
      expect.arrayContaining([
        CanCreateApiToken,
        CanGetApiTokens,
        CanRevokeApiToken,
      ])
    );
  });

  it.each([CanGetAllApiTokens, CanRevokeAllApiTokens])(
    'does not let editors reach other users API keys: $id',
    permission => {
      expect(EditorPermissions).not.toContain(permission);
    }
  );

  it.each([CanGetAllApiTokens, CanRevokeAllApiTokens])(
    'keeps $id for admins',
    permission => {
      expect(AllPermissions).toContain(permission);
    }
  );
});
