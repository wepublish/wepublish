import { FullEngagementPromptFragment } from '@wepublish/website/api';

/**
 * What the website tells analytics about prompts: no reader data, only which
 * prompt. Conversions are not inferred from clicks: they happen on the server
 * (a subscription or a confirmed registration), which is where to count them.
 */
export type EngagementEvent = {
  type: 'impression' | 'click' | 'dismiss';
  ruleId: string;
  ruleVersion: number;
  stageId: string;
  placement: string;
  goal: string;
};

export const ENGAGEMENT_EVENT = 'wepublish:engagement';

declare global {
  interface Window {
    dataLayer?: unknown[];
    plausible?: (event: string, options?: { props?: object }) => void;
  }
}

export const engagementEvent = (
  type: EngagementEvent['type'],
  { ruleId, ruleVersion, goal, stage }: FullEngagementPromptFragment
): EngagementEvent => ({
  type,
  ruleId,
  ruleVersion,
  stageId: stage.id,
  placement: stage.placement,
  goal,
});

export function trackEngagement(event: EngagementEvent) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(ENGAGEMENT_EVENT, { detail: event }));
  window.dataLayer?.push({
    event: `engagement_${event.type}`,
    engagement: event,
  });

  const { type, ...props } = event;
  window.plausible?.(`Engagement ${type}`, { props });
}

const trackedImpressions = new Set<string>();

export const resetTrackedImpressions = () => trackedImpressions.clear();

/** Once per prompt and page view, however often it renders. */
export function trackImpressionOnce(prompt: FullEngagementPromptFragment) {
  if (typeof window === 'undefined') {
    return;
  }

  const event = engagementEvent('impression', prompt);
  const key = [
    window.location.pathname,
    event.ruleId,
    event.ruleVersion,
    event.stageId,
  ].join(':');

  if (trackedImpressions.has(key)) {
    return;
  }

  trackedImpressions.add(key);
  trackEngagement(event);
}
