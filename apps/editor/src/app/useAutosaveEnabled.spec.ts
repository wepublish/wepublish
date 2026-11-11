import { act, renderHook } from '@testing-library/react';

import {
  AUTOSAVE_ENABLED_STORAGE_KEY,
  useAutosaveEnabled,
} from './useAutosaveEnabled';

describe('useAutosaveEnabled', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is on until someone turns it off', () => {
    const { result } = renderHook(() => useAutosaveEnabled());

    expect(result.current[0]).toBe(true);
  });

  it('remembers the choice for the next article', () => {
    const { result } = renderHook(() => useAutosaveEnabled());

    act(() => result.current[1](false));

    expect(localStorage.getItem(AUTOSAVE_ENABLED_STORAGE_KEY)).toBe('false');

    const { result: next } = renderHook(() => useAutosaveEnabled());

    expect(next.current[0]).toBe(false);
  });

  it('ignores a value that is not a boolean', () => {
    localStorage.setItem(AUTOSAVE_ENABLED_STORAGE_KEY, 'nope');

    const { result } = renderHook(() => useAutosaveEnabled());

    expect(result.current[0]).toBe(true);
  });
});
