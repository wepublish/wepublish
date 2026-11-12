import { act, renderHook } from '@testing-library/react';
import { useResendCountdown } from './use-resend-countdown';

describe('useResendCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('has nothing to wait for before a mail was sent', () => {
    const { result } = renderHook(() => useResendCountdown());

    expect(result.current[0]).toBe(0);
  });

  it('counts the seconds down until a new mail may be requested', () => {
    const { result } = renderHook(() => useResendCountdown());

    act(() => result.current[1]());
    expect(result.current[0]).toBe(60);

    act(() => vi.advanceTimersByTime(45_000));
    expect(result.current[0]).toBe(15);

    act(() => vi.advanceTimersByTime(15_000));
    expect(result.current[0]).toBe(0);
  });
});
