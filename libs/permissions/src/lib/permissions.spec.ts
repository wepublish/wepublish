import {
  AllPermissions,
  CanCreateApiToken,
  CanDeleteGiftCodes,
  CanGetAllApiTokens,
  CanGetApiTokens,
  CanGetGiftCodes,
  CanRevokeAllApiTokens,
  CanRevokeApiToken,
  CanUpdateGiftCodes,
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

describe('gift code permissions', () => {
  const giftCodePermissions = [
    ['CAN_GET_GIFT_CODES', CanGetGiftCodes],
    ['CAN_UPDATE_GIFT_CODES', CanUpdateGiftCodes],
    ['CAN_DELETE_GIFT_CODES', CanDeleteGiftCodes],
  ] as const;

  it.each(giftCodePermissions)(
    'gives admins and custom roles %s',
    (id, permission) => {
      expect(permission?.id).toBe(id);
      expect(permission?.deprecated).toBe(false);
      expect(AllPermissions).toContain(permission);
    }
  );

  it.each(giftCodePermissions)(
    'keeps %s away from editors',
    (_, permission) => {
      expect(EditorPermissions).not.toContain(permission);
    }
  );
});
