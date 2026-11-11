import type { Command, CommandMatch } from './command';
import { fuzzyMatch } from './fuzzyMatch';

const SECTION_WEIGHT = 0.8;
const KEYWORD_WEIGHT = 0.5;

const scoreOf = (query: string, text: string) =>
  fuzzyMatch(query, text)?.score ?? null;

const best = (a: number | null, b: number | null) =>
  a === null ? b
  : b === null ? a
  : Math.max(a, b);

export function searchCommands(
  commands: Command[],
  query: string
): CommandMatch[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return commands.map(command => ({ command, indices: [] }));
  }

  return commands
    .flatMap(command => {
      const title = fuzzyMatch(trimmed, command.title);

      const qualified =
        command.section ?
          scoreOf(trimmed, `${command.section} ${command.title}`)
        : null;

      const keyword = (command.keywords ?? []).reduce<number | null>(
        (highest, word) => best(highest, scoreOf(trimmed, word)),
        null
      );

      const score = best(
        best(
          title?.score ?? null,
          qualified === null ? null : qualified * SECTION_WEIGHT
        ),
        keyword === null ? null : keyword * KEYWORD_WEIGHT
      );

      if (score === null) {
        return [];
      }

      return [
        {
          command,
          indices: title ? title.indices : [],
          score,
        },
      ];
    })
    .sort((a, b) => b.score - a.score)
    .map(({ command, indices }) => ({ command, indices }));
}
