import type { Command, CommandMatch } from './command';

export interface GroupedMatch extends CommandMatch {
  index: number;
}

export interface CommandMatchGroup {
  group: Command['group'];
  matches: GroupedMatch[];
}

export function groupMatches(
  matches: CommandMatch[],
  showFavourites: boolean
): CommandMatchGroup[] {
  const order: Command['group'][] = [];
  const buckets = new Map<Command['group'], CommandMatch[]>();

  for (const match of matches) {
    const group =
      !showFavourites && match.command.group === 'favourite' ?
        'navigate'
      : match.command.group;

    if (!buckets.has(group)) {
      buckets.set(group, []);
      order.push(group);
    }

    buckets.get(group)!.push(match);
  }

  let index = 0;

  return order.map(group => ({
    group,
    matches: buckets.get(group)!.map(match => ({ ...match, index: index++ })),
  }));
}
