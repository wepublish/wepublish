import { EngagementAudience, EngagementRequirement } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { CanGetArticle, CanPreview } from '@wepublish/permissions';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';
import { isActiveSubscription } from '@wepublish/utils/api';

/**
 * Newsletter subscriptions can not be verified yet (the Mailchimp sync adds
 * every active user as subscribed), so this is always `unknown`. A
 * `NewsletterVerifier` can change that later.
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
  /** An active membership that costs something (`monthlyAmount > 0`). */
  paying: boolean;
  newsletter: NewsletterStatus;
  /** A paywall bypass token the server checked. */
  paywallBypassed?: boolean;
};

export type ReaderSubscription = {
  memberPlanId: string;
  monthlyAmount: number;
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
    paying: false,
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
    paying: active.some(s => s.monthlyAmount > 0),
    newsletter,
  };
}

export function matchesAudience(
  audience: EngagementAudience,
  reader: ReaderContext,
  memberPlanIds: string[] = []
): boolean {
  const member = reader.activeMemberPlanIds.length > 0;

  switch (audience) {
    case EngagementAudience.ALL:
      return true;
    case EngagementAudience.ANONYMOUS:
      return !reader.loggedIn;
    case EngagementAudience.REGISTERED:
      return reader.loggedIn;
    case EngagementAudience.NON_MEMBERS:
      return !member;
    case EngagementAudience.MEMBERS:
      return member;
    case EngagementAudience.NON_PAYING:
      return !reader.paying;
    case EngagementAudience.PAYING_MEMBERS:
      return reader.paying;
    case EngagementAudience.PAYWALL_BYPASSED:
      return !!reader.paywallBypassed;
    case EngagementAudience.MEMBER_PLANS:
      return memberPlanIds.some(id => reader.activeMemberPlanIds.includes(id));
  }
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
    case EngagementRequirement.PAID_MEMBERSHIP:
      return reader.paying;
  }
}
