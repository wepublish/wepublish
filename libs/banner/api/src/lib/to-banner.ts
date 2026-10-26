import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementGoal,
} from '@prisma/client';
import {
  EngagementRuleWithStages,
  EngagementStageWithActions,
  ReaderContext,
  matchingRules,
  resolvePrompts,
} from '@wepublish/engagement/api';
import { BannerActionRole } from './banner-action.model';
import {
  Banner,
  BannerDocumentType,
  LoginStatus,
  PrimaryBannerArgs,
} from './banner.model';

const LOGIN_STATUS: Record<EngagementAudience, LoginStatus> = {
  ALL: LoginStatus.ALL,
  ANONYMOUS: LoginStatus.LOGGED_OUT,
  REGISTERED: LoginStatus.LOGGED_IN,
  NON_MEMBERS: LoginStatus.UNSUBSCRIBED,
  NON_PAYING: LoginStatus.UNSUBSCRIBED,
  MEMBERS: LoginStatus.SUBSCRIBED,
  PAYING_MEMBERS: LoginStatus.SUBSCRIBED,
  PAYWALL_BYPASSED: LoginStatus.PAYWALL_BYPASSED,
};

const ROLE: Record<EngagementActionRole, BannerActionRole> = {
  PRIMARY: BannerActionRole.PRIMARY,
  CANCEL: BannerActionRole.CANCEL,
  OTHER: BannerActionRole.OTHER,
};

/** Older websites only follow urls. */
const URL_OF: Partial<Record<EngagementActionType, string>> = {
  LOGIN: '/login',
  REGISTER: '/signup',
  MEMBERSHIP: '/mitmachen',
};

export const toBanner = (
  rule: EngagementRuleWithStages,
  stage: EngagementStageWithActions
): Banner => ({
  id: rule.id,
  title: stage.title ?? '',
  text: stage.text ?? '',
  cta: stage.cta,
  html: stage.html,
  embedUrl: stage.embedUrl,
  active: rule.active,
  collapsible: stage.dismissible,
  delay: stage.delaySeconds,
  hideForMinutes: stage.hideForMinutes,
  showOnArticles: rule.showOnArticles,
  imageId: stage.imageId,
  showOnPages: rule.showOnPageIds.map(id => ({ id })),
  showForLoginStatus: LOGIN_STATUS[rule.audience],
  actions: stage.actions.map(({ id, label, url, style, role, type }) => ({
    id,
    label,
    url: url || URL_OF[type] || '',
    style,
    role: ROLE[role],
  })),
});

/**
 * The website tells which reader it is here, as it did before: the result is
 * only presentation, access is decided on the server.
 */
export function primaryBannerOf(
  rules: EngagementRuleWithStages[],
  args: PrimaryBannerArgs
): Banner | null {
  const reader: ReaderContext = {
    kind: args.loggedIn ? 'user' : 'anonymous',
    privileged: false,
    loggedIn: args.loggedIn,
    activeMemberPlanIds: args.hasSubscription ? ['subscription'] : [],
    paying: args.hasSubscription,
    newsletter: 'unknown',
    paywallBypassed: args.hasPaywallBypass,
  };
  const announcements = rules.filter(
    ({ goal }) => goal === EngagementGoal.ANNOUNCEMENT
  );
  const [first] = resolvePrompts({
    rules: matchingRules(
      announcements,
      reader,
      args.documentType === BannerDocumentType.PAGE ?
        { kind: 'page', pageId: args.documentId }
      : {
          kind: 'article',
          articleId: args.documentId,
          contentGateDisabled: false,
          peered: false,
        }
    ),
    now: new Date(),
  });

  return first ? toBanner(first.rule, first.stage) : null;
}
