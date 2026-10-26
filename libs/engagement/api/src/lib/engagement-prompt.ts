import { EngagementPrompt } from './engagement-rule.model';
import {
  EngagementRuleWithStages,
  EngagementStageWithActions,
} from './engagement-rule.service';

export const toEngagementPrompt = ({
  rule,
  stage,
}: {
  rule: EngagementRuleWithStages;
  stage: EngagementStageWithActions;
}): EngagementPrompt => ({
  ruleId: rule.id,
  ruleVersion: rule.version,
  goal: rule.goal,
  stage,
});
