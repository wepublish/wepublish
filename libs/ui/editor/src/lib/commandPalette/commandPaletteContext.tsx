import { useHotkey } from '@tanstack/react-hotkeys';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
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

export const COMMAND_PALETTE_HOTKEY = 'Mod+K';

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

  useHotkey(
    COMMAND_PALETTE_HOTKEY,
    event => {
      if (event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      toggle();
    },
    { enabled, preventDefault: false, stopPropagation: false }
  );

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
