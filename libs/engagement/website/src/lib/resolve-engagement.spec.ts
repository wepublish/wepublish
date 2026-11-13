import {
  mockAnnouncementPrompt,
  mockArticleAccess,
  mockEngagementPrompt,
  mockHardEngagementPrompt,
  mockRestrictedByRule,
} from '@wepublish/mocks/website';
import {
  ArticleAccessSource,
  EngagementGoal,
  EngagementPlacement,
} from '@wepublish/website/api';
import { dismissalKey, resolveEngagement } from './resolve-engagement';

const now = new Date('2026-10-26T12:00:00Z').getTime();
const minutes = (count: number) => count * 60 * 1000;

const modal = mockEngagementPrompt({
  ruleId: 'modal-rule',
  stage: { id: 'modal', placement: EngagementPlacement.Modal },
});
const otherModal = mockEngagementPrompt({
  ruleId: 'other-modal-rule',
  stage: { id: 'other-modal', placement: EngagementPlacement.Modal },
});
const inline = mockEngagementPrompt({
  ruleId: 'inline-rule',
  goal: EngagementGoal.Membership,
  stage: { id: 'inline', placement: EngagementPlacement.Inline },
});
const announcement = mockAnnouncementPrompt();
const metaBanner = mockEngagementPrompt({
  ruleId: 'membership-banner-rule',
  goal: EngagementGoal.Membership,
  stage: { id: 'membership-banner', placement: EngagementPlacement.Banner },
});
const hard = mockHardEngagementPrompt();

const ids = (resolved: ReturnType<typeof resolveEngagement>) => ({
  restriction:
    resolved.restriction?.prompt?.stage.id ?? resolved.restriction?.source,
  banner: resolved.banner?.stage.id,
  modal: resolved.modal?.stage.id,
  inline: resolved.inline?.stage.id,
});

describe('resolveEngagement', () => {
  it('fills every slot with the first prompt for it, in the order of the server', () => {
    expect(
      ids(
        resolveEngagement({
          access: mockArticleAccess(),
          prompts: [announcement, modal, otherModal, inline, metaBanner],
          dismissals: {},
          now,
        })
      )
    ).toEqual({
      restriction: undefined,
      banner: 'announcement-stage',
      modal: 'modal',
      inline: 'inline',
    });
  });

  it('shows a single modal at a time', () => {
    expect(
      resolveEngagement({
        prompts: [modal, otherModal],
        dismissals: {},
        now,
      }).modal
    ).toBe(modal);
  });

  it('gives the cutoff slot to the hard stage that restricts the article', () => {
    expect(
      resolveEngagement({
        access: mockRestrictedByRule(hard),
        prompts: [hard, modal],
        dismissals: {},
        now,
      }).restriction
    ).toEqual({ source: ArticleAccessSource.EngagementRule, prompt: hard });
  });

  it('gives the cutoff slot to an enforced paywall, which the paywall renders', () => {
    expect(
      resolveEngagement({
        access: mockArticleAccess({
          granted: false,
          source: ArticleAccessSource.Paywall,
          paywallId: 'paywall',
          previewBlocks: 2,
        }),
        prompts: [modal],
        dismissals: {},
        now,
      }).restriction
    ).toEqual({ source: ArticleAccessSource.Paywall, prompt: undefined });
  });

  it('shows no modal, inline prompt or non-announcement banner while restricted', () => {
    expect(
      ids(
        resolveEngagement({
          access: mockRestrictedByRule(hard),
          prompts: [hard, metaBanner, announcement, modal, inline],
          dismissals: {},
          now,
        })
      )
    ).toEqual({
      restriction: 'stage-hard',
      banner: 'announcement-stage',
      modal: undefined,
      inline: undefined,
    });
  });

  it('hides a dismissed prompt for its hideForMinutes, then shows it again', () => {
    const dismissals = { [dismissalKey(modal)]: now - minutes(10) };

    expect(
      resolveEngagement({
        prompts: [
          mockEngagementPrompt({
            ...modal,
            stage: { ...modal.stage, hideForMinutes: 60 },
          }),
          otherModal,
        ],
        dismissals,
        now,
      }).modal?.stage.id
    ).toBe('other-modal');

    expect(
      resolveEngagement({
        prompts: [
          mockEngagementPrompt({
            ...modal,
            stage: { ...modal.stage, hideForMinutes: 5 },
          }),
        ],
        dismissals,
        now,
      }).modal?.stage.id
    ).toBe('modal');
  });

  it('shows a prompt again once its rule changed', () => {
    const dismissals = { [dismissalKey(modal)]: now };

    expect(dismissalKey(modal)).toBe('modal-rule:1:modal');
    expect(
      resolveEngagement({
        prompts: [mockEngagementPrompt({ ...modal, ruleVersion: 2 })],
        dismissals,
        now,
      }).modal
    ).toBeDefined();
  });

  it('ignores dismissals of prompts that can not be dismissed', () => {
    const sticky = mockEngagementPrompt({
      ...modal,
      stage: { ...modal.stage, dismissible: false },
    });

    expect(
      resolveEngagement({
        prompts: [sticky],
        dismissals: { [dismissalKey(sticky)]: now },
        now,
      }).modal
    ).toBe(sticky);
  });

  it('hides banners closed with the banner of older releases', () => {
    expect(
      resolveEngagement({
        prompts: [announcement],
        dismissals: {},
        legacyBannerClosedAt: now - minutes(5),
        now,
      }).banner
    ).toBeUndefined();

    expect(
      resolveEngagement({
        prompts: [announcement],
        dismissals: {},
        legacyBannerClosedAt: now - minutes(24 * 60 + 1),
        now,
      }).banner
    ).toBe(announcement);
  });

  it('puts a soft cutoff after the article, like an inline prompt', () => {
    const softCutoff = mockEngagementPrompt({
      stage: { id: 'soft-cutoff', placement: EngagementPlacement.Cutoff },
    });

    expect(
      resolveEngagement({ prompts: [softCutoff], dismissals: {}, now }).inline
    ).toBe(softCutoff);
  });

  it('never shows a hard stage that does not restrict', () => {
    expect(
      ids(
        resolveEngagement({
          access: mockArticleAccess(),
          prompts: [hard],
          dismissals: {},
          now,
        })
      )
    ).toEqual({
      restriction: undefined,
      banner: undefined,
      modal: undefined,
      inline: undefined,
    });
  });
});
