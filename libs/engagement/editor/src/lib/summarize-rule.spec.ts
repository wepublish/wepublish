import {
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { hardStage, stageDefaults } from './engagement-rule-values';
import { summarizeStages, summarizeWhere } from './summarize-rule';

const en: Record<string, string> = {
  'engagement.summary.announcement': 'From the first visit: {{placement}}',
  'engagement.summary.article': 'Article {{number}}',
  'engagement.summary.articles': 'Articles {{from}}–{{to}}',
  'engagement.summary.fromArticle': 'From article {{number}}',
  'engagement.summary.closable': '{{placement}}, can be closed',
  'engagement.summary.hard':
    '{{requirement}} required, {{count}} blocks preview',
  'engagement.summary.placement.MODAL': 'pop-up',
  'engagement.summary.placement.BANNER': 'banner',
  'engagement.summary.placement.INLINE': 'box in the article',
  'engagement.summary.requirement.REGISTRATION': 'Registration',
};

const t = ((key: string, params: Record<string, unknown> = {}) =>
  (en[key] ?? key).replace(/{{(\w+)}}/g, (_, name) =>
    String(params[name])
  )) as unknown as TFunction;

describe('summarizeStages', () => {
  it('says when each stage shows and what it asks for', () => {
    expect(
      summarizeStages(
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
    ).toEqual([
      'Articles 3–4: pop-up, can be closed',
      'From article 5: Registration required, 3 blocks preview',
    ]);
  });

  it('names a single article and stages that can not be dismissed', () => {
    expect(
      summarizeStages(
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
    ).toEqual([
      'Article 1: box in the article',
      'From article 2: pop-up, can be closed',
    ]);
  });

  it('summarizes an announcement by its placement', () => {
    expect(
      summarizeStages(
        {
          goal: EngagementGoal.Announcement,
          stages: [stageDefaults({ placement: EngagementPlacement.Banner })],
        },
        t
      )
    ).toEqual(['From the first visit: banner']);
  });

  it('lists the stages one by one, for a step by step view', () => {
    expect(
      summarizeStages(
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
    ).toEqual([
      'Articles 3–4: pop-up, can be closed',
      'From article 5: Registration required, 3 blocks preview',
    ]);
  });

  it('says when a stage shows from the first article on', () => {
    expect(
      summarizeStages(
        {
          goal: EngagementGoal.Membership,
          stages: [
            stageDefaults({ afterArticles: 0, dismissible: false }),
            stageDefaults({ afterArticles: 3, dismissible: false }),
            stageDefaults({ afterArticles: 4, dismissible: false }),
          ],
        },
        t
      )
    ).toEqual([
      'Articles 1–3: pop-up',
      'Article 4: pop-up',
      'From article 5: pop-up',
    ]);
    expect(
      summarizeStages(
        {
          goal: EngagementGoal.Membership,
          stages: [stageDefaults({ afterArticles: 0, dismissible: false })],
        },
        t
      )
    ).toEqual(['From article 1: pop-up']);
  });

  it('does not make up a range for stages out of order', () => {
    expect(
      summarizeStages(
        {
          goal: EngagementGoal.Membership,
          stages: [
            stageDefaults({ afterArticles: 14, dismissible: false }),
            stageDefaults({ afterArticles: 4, dismissible: false }),
          ],
        },
        t
      )
    ).toEqual(['Article 15: pop-up', 'From article 5: pop-up']);
  });
});

describe('summarizeWhere', () => {
  const keys = ((key: string, params: Record<string, unknown> = {}) =>
    params['count'] != null ?
      `${key}:${params['count']}`
    : key) as unknown as TFunction;

  it('lists articles, pages and peered articles', () => {
    expect(
      summarizeWhere(
        {
          showOnArticles: true,
          showOnPageIds: ['page-1', 'page-2'],
          includePeeredArticles: true,
        },
        keys
      )
    ).toBe(
      'engagement.list.articles, engagement.list.pages:2, engagement.list.peered'
    );
    expect(
      summarizeWhere(
        {
          showOnArticles: false,
          showOnPageIds: ['page-1'],
          includePeeredArticles: false,
        },
        keys
      )
    ).toBe('engagement.list.pages:1');
  });
});
