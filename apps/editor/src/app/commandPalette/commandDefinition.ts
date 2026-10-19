import type { CommandContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

export interface CommandDefinition {
  id: string;
  favourite?: boolean;
  titleKey: string;
  sectionKey?: string;
  icon: ReactNode;
  permissions?: string[];
  perform(context: CommandContext): void;
}
