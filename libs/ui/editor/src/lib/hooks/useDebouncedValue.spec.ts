import { act, renderHook } from '@testing-library/react';

import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts with the current value', () => {
    const { result } = renderHook(() => useDebouncedValue('sun', 300));

    expect(result.current).toBe('sun');
  });

  it('follows a change only once it settled', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: '' } }
    );

    rerender({ value: 's' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'su' });
    act(() => vi.advanceTimersByTime(200));

    expect(result.current).toBe('');

    act(() => vi.advanceTimersByTime(100));

    expect(result.current).toBe('su');
  });
});
