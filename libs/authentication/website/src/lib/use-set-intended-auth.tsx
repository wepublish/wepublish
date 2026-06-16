import { useCallback, useEffect } from 'react';
import {
  IntendedRouteExpiryInSeconds,
  IntendedRouteStorageKey,
} from './auth.constants';
import { add } from 'date-fns';
// we only use the client side implementation which isn't next specific
import { setCookie } from 'cookies-next';

export const isValidIntendedRoute = (
  intendedRoute: unknown
): intendedRoute is string => {
  return typeof intendedRoute === 'string' && intendedRoute.startsWith('/');
};

export const createIntendedRouteCookieOptions = () => ({
  expires: add(new Date(), {
    seconds: IntendedRouteExpiryInSeconds,
  }),
});

export const setIntendedRouteCookie = (intendedRoute: string) => {
  setCookie(
    IntendedRouteStorageKey,
    intendedRoute,
    createIntendedRouteCookieOptions()
  );
};

export const usePersistIntendedRoute = (intendedRoute: unknown) => {
  useEffect(() => {
    if (isValidIntendedRoute(intendedRoute)) {
      setIntendedRouteCookie(intendedRoute);
    }
  }, [intendedRoute]);
};

export const useSetIntendedRoute = () => {
  return useCallback(() => {
    setIntendedRouteCookie(window.location.pathname);
  }, []);
};
