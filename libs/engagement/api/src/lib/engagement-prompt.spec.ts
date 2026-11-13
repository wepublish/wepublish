import { EngagementActionRole, EngagementActionType } from '@prisma/client';
import { toEngagementPrompt } from './engagement-prompt';
import {
  EngagementRuleWithStages,
  EngagementStageWithActions,
} from './engagement-rule.service';

const action = (
  type: EngagementActionType,
  url = ''
): EngagementStageWithActions['actions'][number] => ({
  id: type,
  stageId: 'stage',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  type,
  label: '',
  url,
  style: '',
  role: EngagementActionRole.PRIMARY,
});

const promptWith = (...actions: EngagementStageWithActions['actions']) => ({
  rule: {
    id: 'rule',
    version: 2,
    goal: 'ANNOUNCEMENT',
  } as EngagementRuleWithStages,
  stage: { id: 'stage', actions } as EngagementStageWithActions,
});

describe('toEngagementPrompt', () => {
  it("leads the switch to yearly to the reader's monthly subscription", () => {
    expect(
      toEngagementPrompt(
        promptWith(
          action(EngagementActionType.SWITCH_TO_YEARLY),
          action(EngagementActionType.URL, '/about')
        ),
        { monthlySubscriptionId: 'sub-1' }
      ).stage.actions.map(({ url }) => url)
    ).toEqual(['/profile/subscription/sub-1?switchTo=yearly', '/about']);
  });

  it('leads the switch to yearly to the profile without a monthly subscription', () => {
    expect(
      toEngagementPrompt(
        promptWith(action(EngagementActionType.SWITCH_TO_YEARLY)),
        {}
      ).stage.actions[0].url
    ).toBe('/profile');
  });

  it('keeps a url the editor chose', () => {
    expect(
      toEngagementPrompt(
        promptWith(action(EngagementActionType.SWITCH_TO_YEARLY, '/yearly')),
        { monthlySubscriptionId: 'sub-1' }
      ).stage.actions[0].url
    ).toBe('/yearly');
  });
});
