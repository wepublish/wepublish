import { renderHook } from '@testing-library/react';
import {
  IntendedRouteExpiryInSeconds,
  IntendedRouteStorageKey,
} from './auth.constants';
import {
  createIntendedRouteCookieOptions,
  isValidIntendedRoute,
  setIntendedRouteCookie,
  usePersistIntendedRoute,
} from './use-set-intended-auth';

const clearIntendedRouteCookie = () => {
  document.cookie = `${IntendedRouteStorageKey}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

const getIntendedRouteCookie = () => {
  const value = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith(`${IntendedRouteStorageKey}=`))
    ?.split('=')
    .slice(1)
    .join('=');

  return value ? decodeURIComponent(value) : undefined;
};

describe('intended auth route', () => {
  beforeEach(() => {
    clearIntendedRouteCookie();
  });

  afterEach(() => {
    jest.useRealTimers();
    clearIntendedRouteCookie();
  });

  it('keeps the intended route long enough for the email login flow', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-16T12:00:00.000Z'));

    expect(createIntendedRouteCookieOptions()).toEqual({
      expires: new Date('2026-06-16T12:30:00.000Z'),
    });
    expect(IntendedRouteExpiryInSeconds).toBe(30 * 60);
  });

  it('accepts only a string path from the query value', () => {
    expect(isValidIntendedRoute('/mitmachen')).toBe(true);
    expect(isValidIntendedRoute('/mitmachen?mail=user@example.com')).toBe(true);
    expect(isValidIntendedRoute('https://example.com/mitmachen')).toBe(false);
    expect(isValidIntendedRoute(['/mitmachen'])).toBe(false);
    expect(isValidIntendedRoute(undefined)).toBe(false);
  });

  it('persists the intended query route from an effect', () => {
    renderHook(() => usePersistIntendedRoute('/mitmachen'));

    expect(getIntendedRouteCookie()).toBe('/mitmachen');
  });

  it('ignores invalid query route values', () => {
    renderHook(() => usePersistIntendedRoute(['https://example.com']));

    expect(getIntendedRouteCookie()).toBeUndefined();
  });

  it('sets the intended route cookie directly', () => {
    setIntendedRouteCookie('/mitmachen?mail=user@example.com');

    expect(getIntendedRouteCookie()).toBe('/mitmachen?mail=user@example.com');
  });
});
