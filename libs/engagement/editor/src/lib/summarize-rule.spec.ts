import {
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { hardStage, stageDefaults } from './engagement-rule-values';
import {
  summarizeRule,
  summarizeStages,
  summarizeWhere,
} from './summarize-rule';

const en: Record<string, string> = {
  'engagement.summary.announcement': 'From the first visit: {{placement}}',
  'engagement.summary.always': 'From the first article',
  'engagement.summary.untilRead': 'Until {{count}} articles are read',
  'engagement.summary.afterRead': 'After {{count}} read articles',
  'engagement.summary.afterReadRange': 'After {{from}}–{{to}} read articles',
  'engagement.summary.afterReadOrMore': 'After {{count}} or more read articles',
  'engagement.summary.closable': '{{placement}}, can be closed',
  'engagement.summary.hard':
    'article stops after {{count}} blocks, reading on requires {{requirement}}',
  'engagement.summary.placement.MODAL': 'pop-up over the article',
  'engagement.summary.placement.BANNER': 'banner at the top',
  'engagement.summary.placement.INLINE': 'box inside the article',
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
      'After 2–3 read articles: pop-up over the article, can be closed · After 4 or more read articles: article stops after 3 blocks, reading on requires registration'
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
    ).toBe(
      'Until 1 articles are read: box inside the article · After 1 or more read articles: pop-up over the article, can be closed'
    );
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
    ).toBe('From the first visit: banner at the top');
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
      'After 2–3 read articles: pop-up over the article, can be closed',
      'After 4 or more read articles: article stops after 3 blocks, reading on requires registration',
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
      'Until 3 articles are read: pop-up over the article',
      'After 3 read articles: pop-up over the article',
      'After 4 or more read articles: pop-up over the article',
    ]);
    expect(
      summarizeStages(
        {
          goal: EngagementGoal.Membership,
          stages: [stageDefaults({ afterArticles: 0, dismissible: false })],
        },
        t
      )
    ).toEqual(['From the first article: pop-up over the article']);
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
