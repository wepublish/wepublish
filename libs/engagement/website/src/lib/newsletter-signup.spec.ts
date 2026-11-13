import { act, renderHook } from '@testing-library/react';
import {
  NEWSLETTER_COOKIE_KEY,
  readNewsletterToken,
  storeNewsletterToken,
  useNewsletterToken,
} from './newsletter-signup';

const clearCookie = () => {
  document.cookie = `${NEWSLETTER_COOKIE_KEY}=; max-age=0; path=/`;
};

describe('newsletter signup token', () => {
  beforeEach(() => {
    clearCookie();
    localStorage.clear();
  });
  afterAll(clearCookie);

  it('keeps the token in a cookie, not in local storage', () => {
    expect(readNewsletterToken()).toBeUndefined();

    storeNewsletterToken('signed.token');

    expect(readNewsletterToken()).toBe('signed.token');
    expect(document.cookie).toContain(`${NEWSLETTER_COOKIE_KEY}=signed.token`);
    expect(localStorage.length).toBe(0);
  });

  it('tells every prompt once the reader signed up', () => {
    const { result } = renderHook(() => useNewsletterToken());

    expect(result.current).toBeUndefined();

    act(() => storeNewsletterToken('signed.token'));

    expect(result.current).toBe('signed.token');
  });
});
