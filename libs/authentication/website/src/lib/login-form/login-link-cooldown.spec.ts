import { act, renderHook } from '@testing-library/react';
import { useLoginLinkCooldown } from './login-link-cooldown';

describe('useLoginLinkCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down after a login link was sent', () => {
    const { result } = renderHook(() => useLoginLinkCooldown());

    expect(result.current[0]).toBe(0);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(60);

    act(() => vi.advanceTimersByTime(18000));
    expect(result.current[0]).toBe(42);

    act(() => vi.advanceTimersByTime(42000));
    expect(result.current[0]).toBe(0);
  });

  it('restores the countdown after a reload', () => {
    const first = renderHook(() => useLoginLinkCooldown());
    act(() => first.result.current[1]());
    first.unmount();

    act(() => vi.advanceTimersByTime(30000));
    const { result } = renderHook(() => useLoginLinkCooldown());

    expect(result.current[0]).toBe(30);
  });
});
