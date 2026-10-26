import {
  CanCreateEvent,
  CanGetEvents,
  CanGetOtherOrganizations,
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';

export const EVENT_PERMISSIONS = [CanGetEvents.id, CanCreateEvent.id];

export const AGENDA_PERMISSIONS = [
  ...EVENT_PERMISSIONS,
  CanUpdateOrganization.id,
  CanGetOtherOrganizations.id,
  CanUpdateOtherOrganizations.id,
];
