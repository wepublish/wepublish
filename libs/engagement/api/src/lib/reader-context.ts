import { EngagementAudience, EngagementRequirement } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { CanGetArticle, CanPreview } from '@wepublish/permissions';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';
import { isActiveSubscription } from '@wepublish/utils/api';

/**
 * `subscribed` once the reader gave their email at a newsletter wall (a signed
 * newsletter token). Otherwise `unknown`: subscriptions can not be verified
 * yet (the Mailchimp sync adds every active user as subscribed). A
 * `NewsletterVerifier` can change that for logged-in readers.
 */
export type NewsletterStatus = 'unknown' | 'subscribed' | 'not-subscribed';

export type ReaderKind = 'anonymous' | 'user' | 'apiToken' | 'peer';

/**
 * Everything audiences, requirements and access are decided on. Built from the
 * session only: flags the client sends are never trusted.
 */
export type ReaderContext = {
  kind: ReaderKind;
  /** Editors, previews and peers read everything. */
  privileged: boolean;
  loggedIn: boolean;
  userId?: string;
  activeMemberPlanIds: string[];
  newsletter: NewsletterStatus;
  /** A paywall bypass token the server checked. */
  paywallBypassed?: boolean;
  /** `key=value` utm params of the link the reader came by, as the website sent them. */
  utm?: string[];
};

export type ReaderSubscription = {
  memberPlanId: string;
  startsAt: Date;
  paidUntil: Date | null;
  gracePeriod: number;
};

export function readerContextFrom({
  session,
  subscriptions = [],
  previewHeader = false,
  newsletter = 'unknown',
}: {
  session: AuthSession | null | undefined;
  subscriptions?: ReaderSubscription[];
  previewHeader?: boolean;
  newsletter?: NewsletterStatus;
}): ReaderContext {
  const anonymous: ReaderContext = {
    kind: 'anonymous',
    privileged: false,
    loggedIn: false,
    activeMemberPlanIds: [],
    newsletter: 'unknown',
  };

  if (!session) {
    return anonymous;
  }

  const permissions = permissionsOf(session);

  if (session.type === AuthSessionType.Token) {
    return { ...anonymous, kind: 'peer', privileged: true };
  }

  if (session.type === AuthSessionType.ApiToken) {
    return {
      ...anonymous,
      kind: 'apiToken',
      privileged: hasPermission(CanGetArticle, permissions),
    };
  }

  const active = subscriptions.filter(isActiveSubscription);

  return {
    kind: 'user',
    privileged:
      hasPermission(CanGetArticle, permissions) ||
      (previewHeader && hasPermission(CanPreview, permissions)),
    loggedIn: true,
    userId: session.user.id,
    activeMemberPlanIds: [...new Set(active.map(s => s.memberPlanId))],
    newsletter,
  };
}

export type AudienceOf = {
  audiences: EngagementAudience[];
  excludedAudiences: EngagementAudience[];
  audienceUtm?: string[];
  audienceMemberPlanIds?: string[];
};

const inSegment = (
  segment: EngagementAudience,
  reader: ReaderContext,
  { audienceUtm = [], audienceMemberPlanIds = [] }: AudienceOf
) => {
  switch (segment) {
    case EngagementAudience.ANONYMOUS:
      return !reader.loggedIn;
    case EngagementAudience.MEMBERS:
      return audienceMemberPlanIds.length ?
          audienceMemberPlanIds.some(id =>
            reader.activeMemberPlanIds.includes(id)
          )
        : reader.activeMemberPlanIds.length > 0;
    case EngagementAudience.PAYWALL_BYPASSED:
      return !!reader.paywallBypassed;
    case EngagementAudience.UTM: {
      const params = (reader.utm ?? []).map(param => param.toLowerCase());

      return audienceUtm.some(param => params.includes(param.toLowerCase()));
    }
  }
};

export function matchesAudience(
  audience: AudienceOf,
  reader: ReaderContext
): boolean {
  const isIn = (segment: EngagementAudience) =>
    inSegment(segment, reader, audience);

  return (
    (!audience.audiences.length || audience.audiences.some(isIn)) &&
    !audience.excludedAudiences.some(isIn)
  );
}

export function meetsRequirement(
  requirement: EngagementRequirement,
  reader: ReaderContext
): boolean {
  switch (requirement) {
    case EngagementRequirement.REGISTRATION:
      return reader.loggedIn;
    case EngagementRequirement.MEMBERSHIP:
      return reader.activeMemberPlanIds.length > 0;
    case EngagementRequirement.NEWSLETTER:
      return reader.newsletter === 'subscribed';
  }
}
