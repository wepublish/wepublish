import {
  AllPermissions,
  CanCreateEvent,
  CanCreateImage,
  CanCreateOrganization,
  CanDeleteEvent,
  CanDeleteOrganization,
  CanDeleteOtherOrganizationEvents,
  CanGetEvent,
  CanGetEvents,
  CanGetImage,
  CanGetImages,
  CanGetOtherOrganizationEvents,
  CanGetOtherOrganizations,
  CanGetTags,
  CanGetUsers,
  CanLoginEditor,
  CanPreview,
  CanPublishEvent,
  CanUpdateEvent,
  CanUpdateOrganization,
  CanUpdateOtherOrganizationEvents,
  CanUpdateOtherOrganizations,
  CrossOrganizationPermissions,
} from '@wepublish/permissions';

import { addPredefinedPermissions } from './predefined-permissions';

const ids = (permissions: readonly { id: string }[]) =>
  permissions.map(permission => permission.id);

const eventPermissionIds = ids([
  CanGetEvent,
  CanGetEvents,
  CanCreateEvent,
  CanUpdateEvent,
  CanDeleteEvent,
  CanPublishEvent,
  CanGetOtherOrganizationEvents,
  CanUpdateOtherOrganizationEvents,
  CanDeleteOtherOrganizationEvents,
]);

const organizationPermissionIds = ids([
  CanCreateOrganization,
  CanUpdateOrganization,
  CanDeleteOrganization,
  CanUpdateOtherOrganizations,
  CanGetOtherOrganizations,
]);

const scopedEventPermissionIds = ids([
  CanGetEvent,
  CanGetEvents,
  CanCreateEvent,
  CanUpdateEvent,
  CanDeleteEvent,
  CanPublishEvent,
]);

const permissionsOfRole = (id: string) =>
  addPredefinedPermissions({ id, permissionIDs: [] }).permissionIDs;

describe('addPredefinedPermissions', () => {
  it('names nine event and five organisation permissions', () => {
    expect(eventPermissionIds).toEqual([
      'CAN_GET_EVENT',
      'CAN_GET_EVENTS',
      'CAN_CREATE_EVENT',
      'CAN_UPDATE_EVENT',
      'CAN_DELETE_EVENT',
      'CAN_PUBLISH_EVENT',
      'CAN_GET_OTHER_ORGANIZATION_EVENTS',
      'CAN_UPDATE_OTHER_ORGANIZATION_EVENTS',
      'CAN_DELETE_OTHER_ORGANIZATION_EVENTS',
    ]);
    expect(organizationPermissionIds).toEqual([
      'CAN_CREATE_ORGANIZATION',
      'CAN_UPDATE_ORGANIZATION',
      'CAN_DELETE_ORGANIZATION',
      'CAN_UPDATE_OTHER_ORGANIZATIONS',
      'CAN_GET_OTHER_ORGANIZATIONS',
    ]);
  });

  it('gives the admin every event and organisation permission', () => {
    expect(permissionsOfRole('admin')).toEqual(
      expect.arrayContaining([
        ...eventPermissionIds,
        ...organizationPermissionIds,
      ])
    );
  });

  it('gives the editor the event permissions scoped to its own events', () => {
    expect(permissionsOfRole('editor')).toEqual(
      expect.arrayContaining(scopedEventPermissionIds)
    );
  });

  it('gives the editor no cross-organisation and no organisation permission', () => {
    const editor = permissionsOfRole('editor');
    const forbidden = [
      ...ids(CrossOrganizationPermissions),
      ...organizationPermissionIds,
    ];

    expect(forbidden.filter(id => editor.includes(id))).toEqual([]);
  });

  it('lists each editor permission once', () => {
    const editor = permissionsOfRole('editor');

    expect(new Set(editor).size).toBe(editor.length);
  });

  it('gives the agenda admin every event and organisation permission and what its screens need', () => {
    expect(permissionsOfRole('agenda-admin').sort()).toEqual(
      [
        ...eventPermissionIds,
        ...organizationPermissionIds,
        ...ids([
          CanLoginEditor,
          CanPreview,
          CanGetTags,
          CanGetImage,
          CanGetImages,
          CanCreateImage,
          CanGetUsers,
        ]),
      ].sort()
    );
  });

  it('gives a peer none of the event or organisation permissions', () => {
    const peer = permissionsOfRole('peer');

    expect(
      [...eventPermissionIds, ...organizationPermissionIds].filter(id =>
        peer.includes(id)
      )
    ).toEqual([]);
  });

  it('keeps the stored permissions of a custom role', () => {
    expect(
      addPredefinedPermissions({ id: 'custom', permissionIDs: ['CAN_X'] })
        .permissionIDs
    ).toEqual(['CAN_X']);
  });

  it('registers every permission id once', () => {
    const all = ids(AllPermissions);

    expect(new Set(all).size).toBe(all.length);
  });
});
