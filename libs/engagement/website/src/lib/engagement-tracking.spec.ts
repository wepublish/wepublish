import { mockEngagementPrompt } from '@wepublish/mocks/website';
import {
  EngagementEvent,
  engagementEvent,
  resetTrackedImpressions,
  trackEngagement,
  trackImpressionOnce,
} from './engagement-tracking';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const prompt = mockEngagementPrompt();

describe('engagement tracking', () => {
  let events: EngagementEvent[];
  const listener = (event: Event) =>
    events.push((event as CustomEvent<EngagementEvent>).detail);

  beforeEach(() => {
    events = [];
    resetTrackedImpressions();
    delete window.dataLayer;
    delete window.plausible;
    window.addEventListener('wepublish:engagement', listener);
  });

  afterEach(() => {
    window.removeEventListener('wepublish:engagement', listener);
  });

  it('describes a prompt without anything about the reader', () => {
    expect(engagementEvent('click', prompt)).toEqual({
      type: 'click',
      ruleId: 'rule-1',
      ruleVersion: 1,
      stageId: 'stage-1',
      placement: 'MODAL',
      goal: 'NEWSLETTER',
    });
  });

  it('dispatches a wepublish:engagement event', () => {
    trackEngagement(engagementEvent('dismiss', prompt));

    expect(events).toEqual([engagementEvent('dismiss', prompt)]);
  });

  it('forwards to the data layer and plausible when they are there', () => {
    window.dataLayer = [];
    window.plausible = vi.fn();

    trackEngagement(engagementEvent('click', prompt));

    expect(window.dataLayer).toEqual([
      {
        event: 'engagement_click',
        engagement: engagementEvent('click', prompt),
      },
    ]);
    expect(window.plausible).toHaveBeenCalledWith('Engagement click', {
      props: {
        ruleId: 'rule-1',
        ruleVersion: 1,
        stageId: 'stage-1',
        placement: 'MODAL',
        goal: 'NEWSLETTER',
      },
    });
  });

  it('counts an impression once per prompt and page view', () => {
    trackImpressionOnce(prompt);
    trackImpressionOnce(prompt);
    trackImpressionOnce(mockEngagementPrompt({ ruleVersion: 2 }));

    expect(events.map(({ type, ruleVersion }) => [type, ruleVersion])).toEqual([
      ['impression', 1],
      ['impression', 2],
    ]);

    window.history.pushState({}, '', '/a/another-article');
    trackImpressionOnce(prompt);

    expect(events).toHaveLength(3);
  });
});
