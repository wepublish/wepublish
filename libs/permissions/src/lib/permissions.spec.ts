import {
  AllPermissions,
  CanCreateApiToken,
  CanDeleteGiftCodes,
  CanGetActiveSubscriberFirstNames,
  CanGetAllApiTokens,
  CanGetApiTokens,
  CanGetGiftCodes,
  CanRevokeAllApiTokens,
  CanRevokeApiToken,
  CanUpdateGiftCodes,
  EditorPermissions,
} from './permissions';

describe('CanGetActiveSubscriberFirstNames', () => {
  it('is offered to admins, roles and API keys under a stable id', () => {
    expect(AllPermissions.map(({ id }) => id)).toContain(
      'CAN_GET_ACTIVE_SUBSCRIBER_FIRST_NAMES'
    );
  });

  it('is not granted to editors by default', () => {
    expect(CanGetActiveSubscriberFirstNames).toBeDefined();
    expect(EditorPermissions).not.toContain(CanGetActiveSubscriberFirstNames);
  });
});

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
