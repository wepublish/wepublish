import type { Command } from '@wepublish/ui/editor';
import type { i18n as I18n, TFunction } from 'i18next';

import { ACCOUNT_COMMANDS } from './accountCommands';
import { CREATE_COMMANDS } from './createCommands';
import { NAVIGATION_COMMANDS } from './navigationCommands';
import { toCommand } from './toCommand';

export { ACCOUNT_COMMANDS } from './accountCommands';
export type { CommandDefinition } from './commandDefinition';
export { CREATE_COMMANDS } from './createCommands';
export { NAVIGATION_COMMANDS } from './navigationCommands';

const favouritesFirst = (commands: Command[]) => [
  ...commands.filter(({ group }) => group === 'favourite'),
  ...commands.filter(({ group }) => group !== 'favourite'),
];

export const editorCommands = (t: TFunction, i18n: I18n): Command[] =>
  favouritesFirst([
    ...NAVIGATION_COMMANDS.map(toCommand('navigate', t, i18n)),
    ...CREATE_COMMANDS.map(toCommand('create', t, i18n)),
    ...ACCOUNT_COMMANDS.map(toCommand('account', t, i18n)),
  ]);

export const allCommands = [
  ...NAVIGATION_COMMANDS,
  ...CREATE_COMMANDS,
  ...ACCOUNT_COMMANDS,
];
