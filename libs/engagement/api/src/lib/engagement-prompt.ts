import { EngagementActionType } from '@prisma/client';
import { EngagementPrompt } from './engagement-rule.model';
import {
  EngagementRuleWithStages,
  EngagementStageWithActions,
} from './engagement-rule.service';
import { ReaderContext } from './reader-context';

/** The subscription page opens the switch dialog for `?switchTo=yearly`. */
export const switchToYearlyUrl = ({
  monthlySubscriptionId,
}: Pick<ReaderContext, 'monthlySubscriptionId'>) =>
  monthlySubscriptionId ?
    `/profile/subscription/${monthlySubscriptionId}?switchTo=yearly`
  : '/profile';

/**
 * The prompt for one reader: a switch to yearly leads to the reader's own
 * subscription, unless the editor chose a url.
 */
export const toEngagementPrompt = (
  {
    rule,
    stage,
  }: {
    rule: EngagementRuleWithStages;
    stage: EngagementStageWithActions;
  },
  reader: Pick<ReaderContext, 'monthlySubscriptionId'>
): EngagementPrompt => ({
  ruleId: rule.id,
  ruleVersion: rule.version,
  goal: rule.goal,
  stage: {
    ...stage,
    actions: stage.actions.map(action =>
      action.type === EngagementActionType.SWITCH_TO_YEARLY && !action.url ?
        { ...action, url: switchToYearlyUrl(reader) }
      : action
    ),
  },
});
