import { useCallback, useEffect, useRef, useState } from 'react';

type UseLocalStorageProps<I> = {
  defaultValue?: I;
  serialize: (value: I) => string;
  deserialize: (value: string) => I;
};

export const useLocalStorage = <I>(
  key: string,
  { defaultValue, serialize, deserialize }: UseLocalStorageProps<I>
) => {
  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  const [value, setValue] = useState(defaultValue);
  const previousValue = useRef(defaultValue);
  const currentValue = useRef(defaultValue);
  const storedRaw = useRef<string | null>(null);

  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    storedRaw.current = null;

    return localStorage.removeItem(key);
  }, [key]);

  const set = useCallback(
    (newVal: I) => {
      if (typeof window === 'undefined') {
        return undefined;
      }

      setValue(newVal);

      const raw = serializeRef.current(newVal);
      storedRaw.current = raw;
      localStorage.setItem(key, raw);
      window.dispatchEvent(new StorageEvent('storage'));
    },
    [key]
  );

  useEffect(() => {
    if (currentValue.current !== value) {
      previousValue.current = currentValue.current;
      currentValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    const item = localStorage.getItem(key);

    if (item) {
      storedRaw.current = item;
      setValue(deserializeRef.current(item));
    }
  }, [key, defaultValue]);

  useEffect(() => {
    const storageEventListener = function (e: StorageEvent) {
      // manually fired event
      if (!e.storageArea) {
        const item = localStorage.getItem(key);

        if (item === storedRaw.current) {
          return;
        }

        storedRaw.current = item;
        setValue(item ? deserializeRef.current(item) : undefined);
      }
    };

    window.addEventListener('storage', storageEventListener);

    return () => {
      window.removeEventListener('storage', storageEventListener);
    };
  }, [key]);

  return [value, previousValue, set, remove] as const;
};
