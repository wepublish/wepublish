import { act, renderHook } from '@testing-library/react';

import {
  CHANGELOG_DRAFT_STORAGE_KEY,
  readChangelogDraft,
  useChangelogDraft,
} from './changelogDraft';

describe('changelog draft switch', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/dashboard');
  });

  it('defaults to the first draft', () => {
    expect(readChangelogDraft()).toBe(1);
  });

  it('reads the stored draft and ignores garbage', () => {
    localStorage.setItem(CHANGELOG_DRAFT_STORAGE_KEY, '3');
    expect(readChangelogDraft()).toBe(3);

    localStorage.setItem(CHANGELOG_DRAFT_STORAGE_KEY, '7');
    expect(readChangelogDraft()).toBe(1);
  });

  it('lets the url pick a draft and remembers it', () => {
    window.history.replaceState(null, '', '/dashboard?changelogDraft=2');

    expect(readChangelogDraft()).toBe(2);
    expect(localStorage.getItem(CHANGELOG_DRAFT_STORAGE_KEY)).toBe('2');
  });

  it('updates every hook when one switches the draft', () => {
    const first = renderHook(() => useChangelogDraft());
    const second = renderHook(() => useChangelogDraft());

    act(() => first.result.current[1](3));

    expect(first.result.current[0]).toBe(3);
    expect(second.result.current[0]).toBe(3);
    expect(localStorage.getItem(CHANGELOG_DRAFT_STORAGE_KEY)).toBe('3');
  });
});
