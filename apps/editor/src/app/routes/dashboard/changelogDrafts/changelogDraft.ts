import { useCallback, useSyncExternalStore } from 'react';

/**
 * DRAFT SWITCH — three competing presentations of the changelog live side by
 * side on this branch so they can be compared against real data. Once one is
 * picked, delete this folder's other drafts, this switch and its toggle.
 *
 * 1: compact rows in the dashboard notifications card
 * 2: info entries behind a bell, required actions as bars on top
 * 3: a "What's new" panel off the sidebar, actions only for admins
 */
export type ChangelogDraft = 1 | 2 | 3;

export const CHANGELOG_DRAFTS: ChangelogDraft[] = [1, 2, 3];

export const CHANGELOG_DRAFT_STORAGE_KEY = 'wepublish/changelogDraft';

const URL_PARAM = 'changelogDraft';

const listeners = new Set<() => void>();

const parseDraft = (value: string | null): ChangelogDraft | null => {
  const draft = Number(value);

  return CHANGELOG_DRAFTS.includes(draft as ChangelogDraft) ?
      (draft as ChangelogDraft)
    : null;
};

const store = (draft: ChangelogDraft) => {
  try {
    localStorage.setItem(CHANGELOG_DRAFT_STORAGE_KEY, String(draft));
  } catch {
    // storage blocked: the draft just doesn't survive a reload
  }
};

export function readChangelogDraft(): ChangelogDraft {
  const fromUrl = parseDraft(
    new URLSearchParams(window.location.search).get(URL_PARAM)
  );

  if (fromUrl) {
    store(fromUrl);

    return fromUrl;
  }

  try {
    return parseDraft(localStorage.getItem(CHANGELOG_DRAFT_STORAGE_KEY)) ?? 1;
  } catch {
    return 1;
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export function useChangelogDraft(): [
  ChangelogDraft,
  (draft: ChangelogDraft) => void,
] {
  const draft = useSyncExternalStore(subscribe, readChangelogDraft);

  const setDraft = useCallback((next: ChangelogDraft) => {
    const url = new URL(window.location.href);

    if (url.searchParams.has(URL_PARAM)) {
      url.searchParams.delete(URL_PARAM);
      window.history.replaceState(window.history.state, '', url);
    }

    store(next);
    listeners.forEach(listener => listener());
  }, []);

  return [draft, setDraft];
}
