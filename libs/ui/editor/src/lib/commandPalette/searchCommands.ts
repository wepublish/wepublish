import type { Command, CommandMatch } from './command';
import { fuzzySearch } from './fuzzySearch';

export function searchCommands(
  commands: Command[],
  query: string
): CommandMatch[] {
  return fuzzySearch(commands, query, command => ({
    title: command.title,
    section: command.section,
    keywords: command.keywords,
  })).map(({ item, indices }) => ({ command: item, indices }));
}
