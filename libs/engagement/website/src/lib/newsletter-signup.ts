import { getCookie, setCookie } from 'cookies-next';
import { useSyncExternalStore } from 'react';

/**
 * The newsletterToken a reader got at a newsletter wall, signed by the API. A
 * cookie, not local storage: it is what the reader signed up with, sent with
 * viewArticle and the engagement prompts so no prompt asks for it again.
 */
export const NEWSLETTER_COOKIE_KEY = 'wep_newsletter';

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

const listeners = new Set<() => void>();

export function readNewsletterToken(): string | undefined {
  const token = getCookie(NEWSLETTER_COOKIE_KEY);

  return typeof token === 'string' && token ? token : undefined;
}

export function storeNewsletterToken(token: string) {
  setCookie(NEWSLETTER_COOKIE_KEY, token, {
    maxAge: ONE_YEAR_SECONDS,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  });
  listeners.forEach(listener => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => listeners.delete(listener);
};

/** The token, updated in every prompt the moment the reader signs up. */
export const useNewsletterToken = () =>
  useSyncExternalStore(subscribe, readNewsletterToken, () => undefined);
