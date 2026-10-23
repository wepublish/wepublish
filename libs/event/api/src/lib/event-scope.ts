import { Prisma } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import {
  CanGetOtherOrganizationEvents,
  CanGetOtherOrganizations,
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

type OrganizationEventsWhere = { organizationId: { in: string[] } };
type OwnEventsWhere = { ownerId: string };

export type EventScopeWhere =
  | Record<string, never>
  | OrganizationEventsWhere
  | OwnEventsWhere
  | { OR: Array<OrganizationEventsWhere | OwnEventsWhere> };

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

const userIdOf = (session: Session): string | null =>
  session?.type === AuthSessionType.User ? session.user.id : null;

export const isEventOwner = (session: Session, event: EventOwnership) => {
  const userId = userIdOf(session);

  return userId != null && event.ownerId === userId;
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

export const editorEventsWhere = (session: Session): EventScopeWhere => {
  if (holdsAcrossOrganizations(session, CanGetOtherOrganizationEvents)) {
    return {};
  }

  const organizationEvents = {
    organizationId: { in: organizationIdsOf(session) },
  };
  const userId = userIdOf(session);

  if (userId == null) {
    return organizationEvents;
  }

  return { OR: [organizationEvents, { ownerId: userId }] };
};

export const canModifyEvent = (session: Session, event: EventOwnership) =>
  isEventOwner(session, event) ||
  isOrganizationMember(session, event.organizationId) ||
  isOrganizationMember(session, event.place?.organizationId) ||
  holdsAcrossOrganizations(session, CanUpdateOtherOrganizationEvents);
