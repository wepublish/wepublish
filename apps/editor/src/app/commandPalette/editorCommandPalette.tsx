import {
  AuthContext,
  CommandPalette,
  CommandPaletteProvider,
} from '@wepublish/ui/editor';
import { PropsWithChildren, useContext } from 'react';

import { useEditorCommands } from './useEditorCommands';

export function EditorCommandPaletteProvider({ children }: PropsWithChildren) {
  const { session } = useContext(AuthContext);
  const commands = useEditorCommands();

  return (
    <CommandPaletteProvider
      commands={commands}
      enabled={Boolean(session)}
    >
      {children}
    </CommandPaletteProvider>
  );
}

export function EditorCommandPaletteSurface() {
  const { session } = useContext(AuthContext);

  return session ? <CommandPalette /> : null;
}
