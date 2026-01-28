import { useCallback } from 'react';
import {
  IntendedRouteExpiryInSeconds,
  IntendedRouteStorageKey,
} from './auth.constants';
import { add } from 'date-fns';
// we only use the client side implementation which isn't next specific
import { setCookie } from 'cookies-next';

export const useSetIntendedRoute = () => {
  return useCallback(() => {
    setCookie(IntendedRouteStorageKey, window.location.pathname, {
      expires: add(new Date(), {
        seconds: IntendedRouteExpiryInSeconds,
      }),
    });
  }, []);
};
