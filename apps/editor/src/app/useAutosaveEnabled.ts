import { useLocalStorage } from '@wepublish/ui';
import { useCallback } from 'react';

export const AUTOSAVE_ENABLED_STORAGE_KEY = 'wepublish:editor:autosave';

const serialize = (value: boolean) => JSON.stringify(value);

const deserialize = (value: string) => value !== 'false';

export const useAutosaveEnabled = () => {
  const [enabled, , set] = useLocalStorage(AUTOSAVE_ENABLED_STORAGE_KEY, {
    defaultValue: true,
    serialize,
    deserialize,
  });

  const setEnabled = useCallback((value: boolean) => set(value), [set]);

  return [enabled ?? true, setEnabled] as const;
};
