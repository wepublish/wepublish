import { TFunction } from 'i18next';
import {
  EngagementRuleValues,
  isAnnouncement,
  isHard,
} from './engagement-rule-values';

/**
 * When a stage shows, by the reader's nth article in the window: a stage
 * after `afterArticles` read articles shows from article `afterArticles + 1`.
 */
const when = (
  afterArticles: number,
  nextAfterArticles: number | undefined,
  t: TFunction
) => {
  const from = afterArticles + 1;

  if (nextAfterArticles == null) {
    return t('engagement.summary.fromArticle', { number: from });
  }

  // Stages out of order are refused on save; until then, no made-up range.
  if (nextAfterArticles <= from) {
    return t('engagement.summary.article', { number: from });
  }

  return t('engagement.summary.articles', { from, to: nextAfterArticles });
};

/**
 * The stages one by one, e.g. ["Articles 3–4: pop-up, can be closed",
 * "From article 5: registration required, 3 blocks preview"].
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

/** Where a rule shows, e.g. "Articles, 2 pages, peered articles". */
export function summarizeWhere(
  rule: Pick<
    EngagementRuleValues,
    'showOnArticles' | 'showOnPageIds' | 'includePeeredArticles'
  >,
  t: TFunction
): string {
  return [
    rule.showOnArticles && t('engagement.list.articles'),
    rule.showOnPageIds.length > 0 &&
      t('engagement.list.pages', { count: rule.showOnPageIds.length }),
    rule.includePeeredArticles && t('engagement.list.peered'),
  ]
    .filter(Boolean)
    .join(', ');
}
