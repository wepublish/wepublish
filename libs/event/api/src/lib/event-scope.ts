import { Prisma } from '@prisma/client';
import {
  actingUserOf,
  AuthSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanDeleteOrganization,
  CanDeleteOtherOrganizationEvents,
  CanGetOtherOrganizationEvents,
  CanGetOtherOrganizations,
  CanPublishEvent,
  CanUpdateEvent,
  CanUpdateOrganization,
  CanUpdateOtherOrganizationEvents,
  CanUpdateOtherOrganizations,
  Permission,
} from '@wepublish/permissions';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';

type Session = AuthSession | null | undefined;

export type EventOwnership = {
  organizationId: string | null;
  ownerId: string | null;
  place?: { organizationId: string | null } | null;
};

const isOrganizationKey = (session: Session) =>
  session?.type === AuthSessionType.ApiToken && session.organizationId != null;

const holdsAcrossOrganizations = (session: Session, permission: Permission) =>
  !isOrganizationKey(session) &&
  hasPermission(permission, permissionsOf(session));

export const mayReadAnyOrganization = (session: Session) =>
  holdsAcrossOrganizations(session, CanGetOtherOrganizations) ||
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizations);

export const mayUpdateAnyOrganization = (session: Session) =>
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizations);

export const organizationIdsOf = (session: Session): string[] => {
  switch (session?.type) {
    case AuthSessionType.User:
      return session.organizationIds;

    case AuthSessionType.ApiToken:
      return session.organizationId != null ? [session.organizationId] : [];

    default:
      return [];
  }
};

export const userIdOf = (session: Session): string | null =>
  actingUserOf(session)?.id ?? null;

export const isEventOwner = (session: Session, event: EventOwnership) => {
  const userId = userIdOf(session);

  if (userId == null || event.ownerId !== userId) {
    return false;
  }

  return (
    !isOrganizationKey(session) ||
    isOrganizationMember(session, event.organizationId)
  );
};

const ownedEventsWhere = (session: Session): Prisma.EventWhereInput[] => {
  const userId = userIdOf(session);

  if (userId == null || isOrganizationKey(session)) {
    return [];
  }

  return [{ ownerId: userId }];
};

export const isOrganizationMember = (
  session: Session,
  organizationId: string | null | undefined
) =>
  organizationId != null && organizationIdsOf(session).includes(organizationId);

export const visibleOrganizationsWhere = (
  session: Session
): Prisma.OrganizationWhereInput => {
  if (mayReadAnyOrganization(session)) {
    return {};
  }

  const organizationIds = organizationIdsOf(session);

  if (!organizationIds.length) {
    return { enabled: true };
  }

  return { OR: [{ enabled: true }, { id: { in: organizationIds } }] };
};

export const memberOrganizationsWhere = (
  session: Session
): Prisma.OrganizationWhereInput => ({
  id: { in: organizationIdsOf(session) },
});

export const canReadOrganizationSensitiveData = (
  session: Session,
  organizationId: string | null | undefined
) =>
  organizationId != null &&
  (isOrganizationMember(session, organizationId) ||
    mayReadAnyOrganization(session));

export const canManageOrganization = (
  session: Session,
  organizationId: string
) =>
  isOrganizationMember(session, organizationId) ||
  mayUpdateAnyOrganization(session);

export const canSeeOrganization = (
  session: Session,
  organization: { id: string; enabled: boolean }
) =>
  organization.enabled ||
  isOrganizationMember(session, organization.id) ||
  mayReadAnyOrganization(session);

export const visiblePlacesWhere = (
  session: Session
): Prisma.PlaceWhereInput => {
  if (mayReadAnyOrganization(session)) {
    return {};
  }

  const organizationIds = organizationIdsOf(session);

  if (!organizationIds.length) {
    return { enabled: true };
  }

  return {
    OR: [{ enabled: true }, { organizationId: { in: organizationIds } }],
  };
};

export const selectablePlacesWhere = (
  session: Session
): Prisma.PlaceWhereInput => {
  if (holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents)) {
    return { enabled: true };
  }

  const organizationIds = organizationIdsOf(session);

  if (!organizationIds.length) {
    return { enabled: true, private: false };
  }

  return {
    enabled: true,
    OR: [{ private: false }, { organizationId: { in: organizationIds } }],
  };
};

export const canManagePlace = (
  session: Session,
  organizationId: string | null
) =>
  organizationId == null ?
    mayUpdateAnyOrganization(session)
  : canManageOrganization(session, organizationId);

export const publicEventsWhere = (): Prisma.EventWhereInput => ({
  published: { isNot: null },
});

export const editorEventsWhere = (session: Session): Prisma.EventWhereInput => {
  if (holdsAcrossOrganizations(session, CanGetOtherOrganizationEvents)) {
    return {};
  }

  const organizationEvents = {
    organizationId: { in: organizationIdsOf(session) },
  };
  const ownedEvents = ownedEventsWhere(session);

  if (!ownedEvents.length) {
    return organizationEvents;
  }

  return { OR: [organizationEvents, ...ownedEvents] };
};

export const reachableEventsWhere = (
  session: Session
): Prisma.EventWhereInput => {
  if (
    holdsAcrossOrganizations(session, CanGetOtherOrganizationEvents) ||
    holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents)
  ) {
    return {};
  }

  const organizationIds = organizationIdsOf(session);

  return {
    OR: [
      { organizationId: { in: organizationIds } },
      { place: { organizationId: { in: organizationIds } } },
      ...ownedEventsWhere(session),
    ],
  };
};

export const canReachEvent = (session: Session, event: EventOwnership) =>
  holdsAcrossOrganizations(session, CanGetOtherOrganizationEvents) ||
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents) ||
  isOrganizationMember(session, event.organizationId) ||
  isOrganizationMember(session, event.place?.organizationId) ||
  isEventOwner(session, event);

export const canModifyEvent = (session: Session, event: EventOwnership) =>
  isEventOwner(session, event) ||
  isOrganizationMember(session, event.organizationId) ||
  isOrganizationMember(session, event.place?.organizationId) ||
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents);

export const canPublishEvent = (session: Session, event: EventOwnership) =>
  hasPermission(CanPublishEvent, permissionsOf(session)) &&
  (isOrganizationMember(session, event.organizationId) ||
    (event.organizationId == null && isEventOwner(session, event)) ||
    holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents));

export const canDeleteEvent = (session: Session, event: EventOwnership) =>
  isOrganizationMember(session, event.organizationId) ||
  holdsAcrossOrganizations(session, CanDeleteOtherOrganizationEvents);

export const mayAssignEventOrganization = (
  session: Session,
  organizationId: string | null
) =>
  organizationId == null ||
  isOrganizationMember(session, organizationId) ||
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents);

export const mayDuplicateEvent = (session: Session, event: EventOwnership) =>
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents) ||
  (event.organizationId == null ?
    isEventOwner(session, event)
  : isOrganizationMember(session, event.organizationId));

export const mayChangeShowInPrint = (
  session: Session,
  organization: { partner: boolean } | null
) =>
  organization?.partner === true ||
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents);

export const mayAssignEventOwner = (session: Session, ownerId: string | null) =>
  (ownerId != null && ownerId === userIdOf(session)) ||
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents);

export const mayMoveEventToOrganization = (
  session: Session,
  event: EventOwnership,
  organizationId: string | null
) => {
  if (holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents)) {
    return true;
  }

  const holdsEvent =
    event.organizationId == null ?
      isEventOwner(session, event)
    : isOrganizationMember(session, event.organizationId);

  return (
    holdsEvent &&
    (organizationId == null ?
      isEventOwner(session, event)
    : isOrganizationMember(session, organizationId))
  );
};

export const mayReassignEventOwner = (session: Session) =>
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents);

export const boundOrganizationIdOf = (session: Session): string | null =>
  session?.type === AuthSessionType.ApiToken ?
    (session.organizationId ?? null)
  : null;

export const eventViewerPermissions = (
  session: Session,
  event: EventOwnership & { reviewRequestedAt?: Date | null },
  hasDraft: boolean
) => {
  const granted = permissionsOf(session);
  const update =
    hasPermission(CanUpdateEvent, granted) && canModifyEvent(session, event);
  const publish = canPublishEvent(session, event);

  return {
    update,
    publish,
    delete:
      hasPermission(CanDeleteEvent, granted) && canDeleteEvent(session, event),
    duplicate:
      hasPermission(CanCreateEvent, granted) &&
      mayDuplicateEvent(session, event),
    requestReview: update && !publish && hasDraft && !event.reviewRequestedAt,
    withdrawReview: update && !!event.reviewRequestedAt,
    moveOrganization:
      update &&
      mayMoveEventToOrganization(session, event, event.organizationId),
    clearOrganization:
      update && mayMoveEventToOrganization(session, event, null),
    reassignOwner: update && mayReassignEventOwner(session),
  };
};

export const organizationViewerPermissions = (
  session: Session,
  organizationId: string
) => {
  const granted = permissionsOf(session);
  const manages = canManageOrganization(session, organizationId);
  const update = hasPermission(CanUpdateOrganization, granted) && manages;

  return {
    update,
    updatePrivileged: update && mayUpdateAnyOrganization(session),
    delete: hasPermission(CanDeleteOrganization, granted) && manages,
    manageMembers: mayUpdateAnyOrganization(session),
  };
};

export const placeViewerPermissions = (
  session: Session,
  place: { organizationId: string | null }
) => {
  const manages =
    hasPermission(CanUpdateOrganization, permissionsOf(session)) &&
    canManagePlace(session, place.organizationId);

  return {
    update: manages,
    updatePrivileged: manages && mayUpdateAnyOrganization(session),
    delete: manages,
  };
};
