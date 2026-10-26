import {
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { hardStage, stageDefaults } from './engagement-rule-values';
import { summarizeRule } from './summarize-rule';

const en: Record<string, string> = {
  'engagement.summary.announcement': '{{placement}} from the first visit',
  'engagement.summary.article': 'Article {{from}}',
  'engagement.summary.articles': 'Articles {{from}}–{{to}}',
  'engagement.summary.from': 'from {{from}}',
  'engagement.summary.dismissible': 'dismissible {{placement}}',
  'engagement.summary.hard':
    'requires {{requirement}}, {{count}} preview blocks',
  'engagement.summary.placement.MODAL': 'modal',
  'engagement.summary.placement.BANNER': 'banner',
  'engagement.summary.placement.INLINE': 'prompt in the article',
  'engagement.summary.requirement.REGISTRATION': 'registration',
};

const t = ((key: string, params: Record<string, unknown> = {}) =>
  (en[key] ?? key).replace(/{{(\w+)}}/g, (_, name) =>
    String(params[name])
  )) as unknown as TFunction;

describe('summarizeRule', () => {
  it('says when each stage shows and what it asks for', () => {
    expect(
      summarizeRule(
        {
          goal: EngagementGoal.Newsletter,
          stages: [
            stageDefaults({ afterArticles: 2 }),
            hardStage({
              afterArticles: 4,
              requirement: EngagementRequirement.Registration,
              previewBlocks: 3,
            }),
          ],
        },
        t
      )
    ).toBe(
      'Articles 3–4: dismissible modal · from 5: requires registration, 3 preview blocks'
    );
  });

  it('names a single article and stages that can not be dismissed', () => {
    expect(
      summarizeRule(
        {
          goal: EngagementGoal.Membership,
          stages: [
            stageDefaults({
              afterArticles: 0,
              placement: EngagementPlacement.Inline,
              dismissible: false,
            }),
            stageDefaults({ afterArticles: 1 }),
          ],
        },
        t
      )
    ).toBe('Article 1: prompt in the article · from 2: dismissible modal');
  });

  it('summarizes an announcement by its placement', () => {
    expect(
      summarizeRule(
        {
          goal: EngagementGoal.Announcement,
          stages: [stageDefaults({ placement: EngagementPlacement.Banner })],
        },
        t
      )
    ).toBe('banner from the first visit');
  });
});
