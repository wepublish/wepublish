import { FullEngagementPromptFragment } from '@wepublish/website/api';
import { EngagementDismissals, dismissalKey } from './resolve-engagement';

export const ENGAGEMENT_DISMISSALS_KEY = 'engagement-dismissals';
export const ENGAGEMENT_METER_KEY = 'engagement-meter';
/** The key the banner of older releases remembers its closing in. */
export const LEGACY_BANNER_CLOSED_KEY = 'banner-last-closed';

const storage = () =>
  typeof window === 'undefined' ? undefined : window.localStorage;

export function readDismissals(): EngagementDismissals {
  try {
    const stored = JSON.parse(
      storage()?.getItem(ENGAGEMENT_DISMISSALS_KEY) ?? '{}'
    );

    return stored && typeof stored === 'object' && !Array.isArray(stored) ?
        stored
      : {};
  } catch {
    return {};
  }
}

export function storeDismissal(
  prompt: FullEngagementPromptFragment,
  now = Date.now()
): EngagementDismissals {
  const dismissals = { ...readDismissals(), [dismissalKey(prompt)]: now };

  storage()?.setItem(ENGAGEMENT_DISMISSALS_KEY, JSON.stringify(dismissals));

  return dismissals;
}

export function readLegacyBannerClosedAt(): number | undefined {
  const closedAt = Number(storage()?.getItem(LEGACY_BANNER_CLOSED_KEY));

  return closedAt || undefined;
}

export const readMeterToken = () =>
  storage()?.getItem(ENGAGEMENT_METER_KEY) ?? undefined;

export const storeMeterToken = (token: string) =>
  storage()?.setItem(ENGAGEMENT_METER_KEY, token);
