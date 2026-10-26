import { FullArticleAccessFragment } from '@wepublish/website/api';
import { useSyncExternalStore } from 'react';

/**
 * The access the server decided for an article (`viewArticle`), by article id,
 * so `useShowPaywall` anywhere on the page can follow it.
 */
const accessByArticle = new Map<string, FullArticleAccessFragment>();
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(listener => listener());

export function setArticleAccess(
  articleId: string,
  access: FullArticleAccessFragment
) {
  accessByArticle.set(articleId, access);
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

export const useArticleAccess = (articleId?: string | null) =>
  useSyncExternalStore(
    subscribe,
    () => (articleId ? accessByArticle.get(articleId) : undefined),
    () => undefined
  );
