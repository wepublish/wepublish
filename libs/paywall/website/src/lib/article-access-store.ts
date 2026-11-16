import { SessionTokenContext } from '@wepublish/authentication/website';
import { FullArticleAccessFragment } from '@wepublish/website/api';
import { useContext, useSyncExternalStore } from 'react';

/**
 * The access the server decided for an article (`viewArticle`), by reader and
 * article, so `useShowPaywall` anywhere on the page can follow it and a login
 * or logout never shows another reader's decision.
 */
const accessByArticle = new Map<string, FullArticleAccessFragment>();

const keyOf = (articleId: string, readerId: string | undefined) =>
  `${readerId ?? 'anonymous'}:${articleId}`;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(listener => listener());

export function setArticleAccess(
  articleId: string,
  access: FullArticleAccessFragment,
  readerId: string | undefined
) {
  accessByArticle.set(keyOf(articleId, readerId), access);
  notify();
}

export function clearArticleAccess() {
  accessByArticle.clear();
  notify();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const useArticleAccess = (articleId?: string | null) => {
  const [user] = useContext(SessionTokenContext) ?? [];

  return useSyncExternalStore(
    subscribe,
    () =>
      articleId ? accessByArticle.get(keyOf(articleId, user?.id)) : undefined,
    () => undefined
  );
};
