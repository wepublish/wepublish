import { useEffect, useState } from 'react';

export const useQueryState = <
  T extends Record<string, any> = Record<string, any>,
>(
  initialState: T = {} as T
) => {
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setState(queryParams as unknown as T);
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
