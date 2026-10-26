import { TFunction } from 'i18next';
import {
  EngagementRuleValues,
  isAnnouncement,
  isHard,
} from './engagement-rule-values';

/**
 * The rule in one line, e.g. "Articles 3–4: dismissible modal · from 5:
 * requires registration, 3 preview blocks".
 */
export function summarizeRule(
  rule: Pick<EngagementRuleValues, 'goal' | 'stages'>,
  t: TFunction
): string {
  if (isAnnouncement(rule)) {
    const [stage] = rule.stages;

    return stage ?
        t('engagement.summary.announcement', {
          placement: t(`engagement.summary.placement.${stage.placement}`),
        })
      : '';
  }

  return rule.stages
    .map((stage, index) => {
      const from = stage.afterArticles + 1;
      const next = rule.stages[index + 1];
      const range =
        !next ? t('engagement.summary.from', { from })
        : next.afterArticles === from ?
          t('engagement.summary.article', { from })
        : t('engagement.summary.articles', { from, to: next.afterArticles });
      const placement = t(`engagement.summary.placement.${stage.placement}`);
      const what =
        isHard(stage) ?
          t('engagement.summary.hard', {
            requirement: t(
              `engagement.summary.requirement.${stage.requirement}`
            ),
            count: stage.previewBlocks ?? 0,
          })
        : stage.dismissible ? t('engagement.summary.dismissible', { placement })
        : placement;

      return `${range}: ${what}`;
    })
    .join(' · ');
}
