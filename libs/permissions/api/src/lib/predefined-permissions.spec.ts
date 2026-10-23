import {
  AllPermissions,
  CanCreateOrganization,
  CanDeleteOrganization,
  CanDeleteOtherOrganizationEvents,
  CanGetEvents,
  CanGetOtherOrganizationEvents,
  CanGetOtherOrganizations,
  CanPublishEvent,
  CanUpdateOrganization,
  CanUpdateOtherOrganizationEvents,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';

import { addPredefinedPermissions } from './predefined-permissions';

const agendaPermissionIds = [
  CanGetEvents,
  CanPublishEvent,
  CanGetOtherOrganizationEvents,
  CanUpdateOtherOrganizationEvents,
  CanDeleteOtherOrganizationEvents,
  CanCreateOrganization,
  CanUpdateOrganization,
  CanDeleteOrganization,
  CanUpdateOtherOrganizations,
  CanGetOtherOrganizations,
].map(permission => permission.id);

const permissionsOfRole = (id: string) =>
  addPredefinedPermissions({ id, permissionIDs: [] }).permissionIDs;

describe('addPredefinedPermissions', () => {
  it('gives the admin every agenda and organisation permission', () => {
    expect(agendaPermissionIds).toEqual([
      'CAN_GET_EVENTS',
      'CAN_PUBLISH_EVENT',
      'CAN_GET_OTHER_ORGANIZATION_EVENTS',
      'CAN_UPDATE_OTHER_ORGANIZATION_EVENTS',
      'CAN_DELETE_OTHER_ORGANIZATION_EVENTS',
      'CAN_CREATE_ORGANIZATION',
      'CAN_UPDATE_ORGANIZATION',
      'CAN_DELETE_ORGANIZATION',
      'CAN_UPDATE_OTHER_ORGANIZATIONS',
      'CAN_GET_OTHER_ORGANIZATIONS',
    ]);
    expect(permissionsOfRole('admin')).toEqual(
      expect.arrayContaining(agendaPermissionIds)
    );
  });

  it('gives the editor none of the agenda or organisation permissions', () => {
    const editor = permissionsOfRole('editor');

    expect(agendaPermissionIds.filter(id => editor.includes(id))).toEqual([]);
  });

  it('gives a peer none of the agenda or organisation permissions', () => {
    const peer = permissionsOfRole('peer');

    expect(agendaPermissionIds.filter(id => peer.includes(id))).toEqual([]);
  });

  it('registers every permission id once', () => {
    const ids = AllPermissions.map(permission => permission.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
