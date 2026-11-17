import {
  AllPermissions,
  CanCreateApiToken,
  CanGetAllApiTokens,
  CanGetApiTokens,
  CanRevokeAllApiTokens,
  CanRevokeApiToken,
  CanCreateEngagementRule,
  CanDeleteEngagementRule,
  CanGetEngagementRule,
  CanGetEngagementRules,
  CanUpdateEngagementRule,
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

describe('engagement rule permissions', () => {
  const engagementRulePermissions = [
    CanGetEngagementRule,
    CanGetEngagementRules,
    CanCreateEngagementRule,
    CanUpdateEngagementRule,
    CanDeleteEngagementRule,
  ];

  it('lets editors and admins manage engagement rules', () => {
    expect(EditorPermissions).toEqual(
      expect.arrayContaining(engagementRulePermissions)
    );
    expect(AllPermissions).toEqual(
      expect.arrayContaining(engagementRulePermissions)
    );
  });

  it('uses the ids the audience engagement migration grants', () => {
    expect(engagementRulePermissions.map(({ id }) => id)).toEqual([
      'CAN_GET_ENGAGEMENT_RULE',
      'CAN_GET_ENGAGEMENT_RULES',
      'CAN_CREATE_ENGAGEMENT_RULE',
      'CAN_UPDATE_ENGAGEMENT_RULE',
      'CAN_DELETE_ENGAGEMENT_RULE',
    ]);
  });

  it.each([
    'CAN_CREATE_CONTENT_GATE',
    'CAN_UPDATE_CONTENT_GATE',
    'CAN_DELETE_CONTENT_GATE',
    'CAN_GET_BANNER',
    'CAN_CREATE_BANNER',
  ])('no longer offers %s', id => {
    expect(AllPermissions.map(permission => permission.id)).not.toContain(id);
  });
});
