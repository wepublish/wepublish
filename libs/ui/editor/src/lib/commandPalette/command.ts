import type { FeatureKey } from '@wepublish/features';
import type { ReactNode } from 'react';

export interface CommandContext {
  navigate(to: string): void;
  close(): void;
}

export type CommandGroup = 'favourite' | 'navigate' | 'create' | 'account';

export interface Command {
  id: string;
  group: CommandGroup;
  title: string;
  section?: string;
  keywords?: string[];
  icon: ReactNode;
  permissions?: string[];
  feature?: FeatureKey;
  perform(context: CommandContext): void;
}

export interface CommandMatch {
  command: Command;
  indices: number[];
}
