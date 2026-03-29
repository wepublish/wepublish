import { useEffect, useState } from 'react';

export const useQueryState = <
  T extends Record<string, any> = Record<string, any>,
>(
  initialState: T = {} as T
) => {
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    const listenToPopstate = () => {
      const queryParams = window.location.search;
      setState(new URLSearchParams(queryParams) as unknown as T);
    };
    window.addEventListener('popstate', listenToPopstate);
    return () => {
      window.removeEventListener('popstate', listenToPopstate);
    };
  }, []);

  const setQueryParams = (query?: Partial<T>) => {
    const url = new URL(window.location.href);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, String(value));
        }
      });
    } else {
      url.search = '';
    }
    window.history.replaceState({}, '', url.toString());
  };

  return [state, setQueryParams] as [T, (query?: Partial<T>) => void];
};
