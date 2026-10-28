import {
  EngagementEnforcement,
  EngagementGoal,
  EngagementRequirement,
  EngagementRule,
  EngagementStage,
  NewsletterReferralMode,
} from '@prisma/client';
import { Meter, countedReads, hasRead, referralReads } from './meter';
import {
  ReaderContext,
  matchesAudience,
  meetsRequirement,
} from './reader-context';

/**
 * Pure decisions about engagement rules: which rules apply, which stage a
 * reader reached and whether a metered rule restricts an article. Paywalls are
 * decided in `article-api` (`evaluateArticleAccess`), which calls in here.
 */

/** A url param of a newsletter link: `utm_medium=email`. */
export type ReferralParam = { key: string; value: string };

export type EvaluatedStage = Pick<
  EngagementStage,
  | 'id'
  | 'afterArticles'
  | 'placement'
  | 'enforcement'
  | 'requirement'
  | 'previewBlocks'
>;

export type EvaluatedRule<Stage extends EvaluatedStage = EvaluatedStage> = Pick<
  EngagementRule,
  | 'id'
  | 'goal'
  | 'active'
  | 'priority'
  | 'audience'
  | 'showOnArticles'
  | 'includePeeredArticles'
  | 'meterWindowDays'
  | 'newsletterReferral'
  | 'newsletterReferralLimit'
> & {
  newsletterParams: ReferralParam[] | null;
  showOnPageIds: string[];
  /** The plans of the `MEMBER_PLANS` audience. */
  audienceMemberPlanIds?: string[];
  /** Ordered by `afterArticles`. */
  stages: Stage[];
};

export type EngagementTarget =
  | {
      kind: 'article';
      articleId: string;
      /** "Exclude from metered engagement rules" on the article. */
      contentGateDisabled: boolean;
      peered: boolean;
    }
  | { kind: 'page'; pageId: string };

export type MeteredRestriction = {
  granted: false;
  ruleId: string;
  stageId: string;
  requirement: EngagementRequirement;
  previewBlocks: number;
};

export type MeteredAccess =
  | {
      granted: true;
      /** Whether the read goes on the meter: a metered rule targets it. */
      record: boolean;
      /** Whether a newsletter referral opened it. */
      referral: boolean;
    }
  | MeteredRestriction;

export const isMeteredRestriction = (
  access: MeteredAccess
): access is MeteredRestriction => !access.granted;

/** Rules without a window (should not exist past validation) use this one. */
const FALLBACK_WINDOW_DAYS = 30;

export const isMetered = (rule: Pick<EvaluatedRule, 'goal'>) =>
  rule.goal !== EngagementGoal.ANNOUNCEMENT;

const windowOf = (rule: EvaluatedRule) =>
  rule.meterWindowDays ?? FALLBACK_WINDOW_DAYS;

const isHard = (stage: EvaluatedStage) =>
  stage.enforcement === EngagementEnforcement.HARD;

export const hardStageOf = <Stage extends EvaluatedStage>(
  rule: EvaluatedRule<Stage>
): Stage | undefined => {
  const last = rule.stages.at(-1);

  return last && isHard(last) ? last : undefined;
};

export const maxMeterWindowDays = (rules: EvaluatedRule[]) =>
  Math.max(0, ...rules.filter(isMetered).map(windowOf));

const targets = (rule: EvaluatedRule, target: EngagementTarget) => {
  if (target.kind === 'page') {
    return rule.showOnPageIds.includes(target.pageId);
  }

  if (!rule.showOnArticles) {
    return false;
  }

  if (target.peered && !rule.includePeeredArticles) {
    return false;
  }

  return !(target.contentGateDisabled && isMetered(rule));
};

export function matchingRules<Rule extends EvaluatedRule<EvaluatedStage>>(
  rules: Rule[],
  reader: ReaderContext,
  target: EngagementTarget
): Rule[] {
  return rules.filter(rule => {
    if (
      !rule.active ||
      !matchesAudience(rule.audience, reader, rule.audienceMemberPlanIds)
    ) {
      return false;
    }

    if (!targets(rule, target)) {
      return false;
    }

    const requirement = hardStageOf(rule)?.requirement;

    return !(requirement && meetsRequirement(requirement, reader));
  });
}

export const currentStage = <Stage extends EvaluatedStage>(
  rule: EvaluatedRule<Stage>,
  count: number
): Stage | undefined =>
  rule.stages.filter(stage => stage.afterArticles <= count).at(-1);

const byPromptOrder = (
  a: { rule: EvaluatedRule; stage?: EvaluatedStage },
  b: { rule: EvaluatedRule; stage?: EvaluatedStage }
) =>
  b.rule.priority - a.rule.priority ||
  Number(!!b.stage && isHard(b.stage)) - Number(!!a.stage && isHard(a.stage)) ||
  a.rule.id.localeCompare(b.rule.id);

const referralMatches = (
  rule: EvaluatedRule,
  referral: ReferralParam[] | undefined
) =>
  rule.newsletterReferral !== NewsletterReferralMode.NONE &&
  !!referral?.length &&
  (rule.newsletterParams ?? []).some(param =>
    referral.some(
      given =>
        given.key === param.key && (!param.value || given.value === param.value)
    )
  );

const referralOpens = (
  rule: EvaluatedRule,
  meter: Meter,
  referral: ReferralParam[] | undefined,
  now: Date
) =>
  referralMatches(rule, referral) &&
  (rule.newsletterReferral === NewsletterReferralMode.UNLIMITED ||
    referralReads(meter, windowOf(rule), now) < rule.newsletterReferralLimit);

const restrictedBy = (
  rule: EvaluatedRule,
  stage: EvaluatedStage
): MeteredRestriction => ({
  granted: false,
  ruleId: rule.id,
  stageId: stage.id,
  requirement: stage.requirement ?? EngagementRequirement.REGISTRATION,
  previewBlocks: stage.previewBlocks ?? 0,
});

/**
 * Whether the matching metered rules let the reader read the article.
 *
 * Without a meter (ISR, RSS, API consumers: anyone `viewArticle` did not place
 * on the meter) every matching hard stage restricts. With one, an article is
 * granted when it was already read in the window, when a newsletter referral
 * opens it, or while the counted reads are below the hard stage.
 */
export function meteredAccess({
  rules,
  meter,
  articleId,
  referral,
  now,
}: {
  rules: EvaluatedRule[];
  meter?: Meter;
  articleId: string;
  referral?: ReferralParam[];
  now: Date;
}): MeteredAccess {
  const metered = rules
    .filter(isMetered)
    .map(rule => ({ rule, stage: hardStageOf(rule) }))
    .sort(byPromptOrder);

  for (const { rule, stage } of metered) {
    if (!stage) {
      continue;
    }

    if (!meter) {
      return restrictedBy(rule, stage);
    }

    const window = windowOf(rule);

    if (hasRead(meter, articleId, window, now)) {
      continue;
    }

    if (referralOpens(rule, meter, referral, now)) {
      continue;
    }

    if (countedReads(meter, window, now, articleId) >= stage.afterArticles) {
      return restrictedBy(rule, stage);
    }
  }

  return {
    granted: true,
    record: metered.length > 0,
    referral:
      !!meter &&
      metered.some(
        ({ rule }) =>
          !hasRead(meter, articleId, windowOf(rule), now) &&
          referralOpens(rule, meter, referral, now)
      ),
  };
}

/**
 * At most one stage per rule, in the order the website fills its slots. A hard
 * stage only shows when it is the one restricting the article; otherwise the
 * reader sees the last soft stage they reached.
 */
export function resolvePrompts<Rule extends EvaluatedRule<EvaluatedStage>>({
  rules,
  meter,
  articleId,
  now,
  restriction,
}: {
  rules: Rule[];
  meter?: Meter;
  articleId?: string;
  now: Date;
  restriction?: Pick<MeteredRestriction, 'ruleId' | 'stageId'>;
}): Array<{ rule: Rule; stage: Rule['stages'][number] }> {
  return rules
    .map(rule => {
      const count =
        meter && isMetered(rule) ?
          countedReads(meter, windowOf(rule), now, articleId)
        : 0;
      const stage = currentStage(rule, count);

      if (!stage || !isHard(stage) || restriction?.stageId === stage.id) {
        return { rule, stage };
      }

      return {
        rule,
        stage: rule.stages
          .filter(soft => !isHard(soft) && soft.afterArticles <= count)
          .at(-1),
      };
    })
    .filter(
      (prompt): prompt is { rule: Rule; stage: Rule['stages'][number] } =>
        !!prompt.stage
    )
    .sort(byPromptOrder);
}

/**
 * Articles with an active paywall are left to the paywall: metered rules
 * neither restrict nor prompt there, like on articles excluded from them.
 */
export const articleTarget = (article: {
  id: string;
  contentGateDisabled: boolean;
  peerId?: string | null;
  hasActivePaywall: boolean;
}): EngagementTarget => ({
  kind: 'article',
  articleId: article.id,
  contentGateDisabled: article.contentGateDisabled || article.hasActivePaywall,
  peered: !!article.peerId,
});
