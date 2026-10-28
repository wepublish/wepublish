import { act, renderHook } from '@testing-library/react';
import { mockEngagementPrompt } from '@wepublish/mocks/website';
import {
  ENGAGEMENT_DISMISSALS_KEY,
  LEGACY_BANNER_CLOSED_KEY,
} from './engagement-storage';
import { useEngagementDismissals } from './engagement-slots';
import { dismissalKey } from './resolve-engagement';

const prompt = mockEngagementPrompt();

describe('useEngagementDismissals', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the dismissals of this browser and when it read them', () => {
    localStorage.setItem(
      ENGAGEMENT_DISMISSALS_KEY,
      JSON.stringify({ [dismissalKey(prompt)]: 500 })
    );
    localStorage.setItem(LEGACY_BANNER_CLOSED_KEY, '700');

    const { result } = renderHook(() => useEngagementDismissals());

    expect(result.current.dismissals).toEqual({ [dismissalKey(prompt)]: 500 });
    expect(result.current.legacyBannerClosedAt).toBe(700);
    expect(result.current.now).toBe(1_000_000);
  });

  it('keeps a dismissal and moves its clock along', () => {
    const { result } = renderHook(() => useEngagementDismissals());

    vi.setSystemTime(2_000_000);
    act(() => result.current.dismiss(prompt));

    expect(result.current.dismissals).toEqual({
      [dismissalKey(prompt)]: 2_000_000,
    });
    expect(result.current.now).toBe(2_000_000);
    expect(
      JSON.parse(localStorage.getItem(ENGAGEMENT_DISMISSALS_KEY) ?? '{}')
    ).toEqual({ [dismissalKey(prompt)]: 2_000_000 });
  });

  it('gives the same snapshot until something changes', () => {
    const { result, rerender } = renderHook(() => useEngagementDismissals());
    const first = result.current.dismissals;

    rerender();

    expect(result.current.dismissals).toBe(first);
  });
});
