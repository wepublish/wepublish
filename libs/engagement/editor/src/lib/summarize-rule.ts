import { TFunction } from 'i18next';
import {
  EngagementRuleValues,
  isAnnouncement,
  isHard,
} from './engagement-rule-values';

/**
 * When a stage shows, by the articles a reader already read in the window:
 * that is what `afterArticles` counts.
 */
const when = (
  afterArticles: number,
  nextAfterArticles: number | undefined,
  t: TFunction
) => {
  if (nextAfterArticles == null) {
    return afterArticles === 0 ?
        t('engagement.summary.always')
      : t('engagement.summary.afterReadOrMore', { count: afterArticles });
  }

  if (afterArticles === 0) {
    return t('engagement.summary.untilRead', { count: nextAfterArticles });
  }

  return nextAfterArticles - 1 === afterArticles ?
      t('engagement.summary.afterRead', { count: afterArticles })
    : t('engagement.summary.afterReadRange', {
        from: afterArticles,
        to: nextAfterArticles - 1,
      });
};

/**
 * The stages one by one, e.g. ["After 2–3 read articles: pop-up over the
 * article, can be closed", "After 4 or more read articles: article stops
 * after 3 blocks, reading on requires registration"].
 */
export function summarizeStages(
  rule: Pick<EngagementRuleValues, 'goal' | 'stages'>,
  t: TFunction
): string[] {
  if (isAnnouncement(rule)) {
    const [stage] = rule.stages;

    return stage ?
        [
          t('engagement.summary.announcement', {
            placement: t(`engagement.summary.placement.${stage.placement}`),
          }),
        ]
      : [];
  }

  return rule.stages.map((stage, index) => {
    const placement = t(`engagement.summary.placement.${stage.placement}`);
    const what =
      isHard(stage) ?
        t('engagement.summary.hard', {
          requirement: t(`engagement.summary.requirement.${stage.requirement}`),
          count: stage.previewBlocks ?? 0,
        })
      : stage.dismissible ? t('engagement.summary.closable', { placement })
      : placement;

    return `${when(stage.afterArticles, rule.stages[index + 1]?.afterArticles, t)}: ${what}`;
  });
}

/** The stages in one line, separated by " · ". */
export function summarizeRule(
  rule: Pick<EngagementRuleValues, 'goal' | 'stages'>,
  t: TFunction
): string {
  return summarizeStages(rule, t).join(' · ');
}
