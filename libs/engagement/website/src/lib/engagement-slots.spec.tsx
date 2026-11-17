import { act, renderHook } from '@testing-library/react';
import { mockEngagementPrompt } from '@wepublish/mocks/website';
import {
  ENGAGEMENT_DISMISSALS_KEY,
  LEGACY_BANNER_CLOSED_KEY,
} from './engagement-storage';
import {
  useEngagementDismissals,
  useImpressionWhenShown,
} from './engagement-slots';
import { trackImpressionOnce } from './engagement-tracking';
import { dismissalKey } from './resolve-engagement';

vi.mock('./engagement-tracking', async importOriginal => ({
  ...(await importOriginal<typeof import('./engagement-tracking')>()),
  trackImpressionOnce: vi.fn(),
}));

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

describe('useImpressionWhenShown', () => {
  beforeEach(() => {
    vi.mocked(trackImpressionOnce).mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const delayed = mockEngagementPrompt({
    stage: { delaySeconds: 30 },
  });

  it('counts a prompt once its delay is over and it shows', () => {
    renderHook(() => useImpressionWhenShown(delayed));

    act(() => vi.advanceTimersByTime(29_000));
    expect(trackImpressionOnce).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1_000));
    expect(trackImpressionOnce).toHaveBeenCalledWith(delayed);
  });

  it('counts nothing when the reader leaves before it shows', () => {
    const { unmount } = renderHook(() => useImpressionWhenShown(delayed));

    act(() => vi.advanceTimersByTime(10_000));
    unmount();
    act(() => vi.advanceTimersByTime(30_000));

    expect(trackImpressionOnce).not.toHaveBeenCalled();
  });
});
