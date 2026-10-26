import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Command } from './command';

export interface CommandPaletteValue {
  isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
  commands: Command[];
}

const CommandPaletteContext = createContext<CommandPaletteValue>({
  isOpen: false,
  open: () => undefined,
  close: () => undefined,
  toggle: () => undefined,
  commands: [],
});

const isHotkey = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  (event.key.toLowerCase() === 'k' || event.code === 'KeyK');

export interface CommandPaletteProviderProps {
  commands: Command[];
  enabled?: boolean;
}

export function CommandPaletteProvider({
  commands,
  enabled = true,
  children,
}: PropsWithChildren<CommandPaletteProviderProps>) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(current => !current), []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !isHotkey(event)) {
        return;
      }

      event.preventDefault();
      toggle();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, toggle]);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, commands }),
    [close, commands, isOpen, open, toggle]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export const useCommandPalette = () => useContext(CommandPaletteContext);
