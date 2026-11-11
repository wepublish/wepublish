import { Dispatch, SetStateAction, useCallback, useState } from 'react';

export type UseToggle = {
  value: boolean;
  set: Dispatch<SetStateAction<boolean>>;
  toggle: () => void;
  on: () => void;
  off: () => void;
};

export function useToggle(initialValue = false): UseToggle {
  const [value, set] = useState<boolean>(initialValue);
  const toggle = useCallback(() => set(!value), [value]);

  return {
    value,
    set,
    toggle,
    on: () => set(true),
    off: () => set(false),
  };
}
