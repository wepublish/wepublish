import type { Command, CommandMatch } from './command';
import { groupMatches } from './groupMatches';

const match = (id: string, group: Command['group']): CommandMatch => ({
  command: {
    id,
    group,
    title: id,
    icon: null,
    perform: () => undefined,
  },
  indices: [],
});

const shape = (groups: ReturnType<typeof groupMatches>) =>
  groups.map(group => [
    group.group,
    group.matches.map(({ command }) => command.id),
  ]);

describe('groupMatches', () => {
  it('returns nothing for no matches', () => {
    expect(groupMatches([])).toEqual([]);
  });

  it('collects each group into one block', () => {
    expect(
      shape(
        groupMatches([
          match('articles', 'navigate'),
          match('createArticle', 'create'),
          match('pages', 'navigate'),
        ])
      )
    ).toEqual([
      ['navigate', ['articles', 'pages']],
      ['create', ['createArticle']],
    ]);
  });

  it('orders the blocks by their best match, so the top hit stays first', () => {
    expect(
      shape(
        groupMatches([
          match('createArticle', 'create'),
          match('articles', 'navigate'),
        ])
      )
    ).toEqual([
      ['create', ['createArticle']],
      ['navigate', ['articles']],
    ]);
  });

  it('keeps the favourites in their own block while the palette is idle', () => {
    expect(
      shape(
        groupMatches(
          [match('articles', 'favourite'), match('users', 'navigate')],
          true
        )
      )
    ).toEqual([
      ['favourite', ['articles']],
      ['navigate', ['users']],
    ]);
  });

  it('folds the favourites back into the pages once the reader searches', () => {
    expect(
      shape(
        groupMatches(
          [match('articles', 'favourite'), match('users', 'navigate')],
          false
        )
      )
    ).toEqual([['navigate', ['articles', 'users']]]);
  });

  it('leaves every other group alone when the favourites are folded in', () => {
    expect(
      shape(
        groupMatches(
          [match('createArticle', 'create'), match('articles', 'favourite')],
          false
        )
      )
    ).toEqual([
      ['create', ['createArticle']],
      ['navigate', ['articles']],
    ]);
  });

  it('numbers the rows across blocks so one index can drive the keyboard', () => {
    const groups = groupMatches([
      match('articles', 'navigate'),
      match('createArticle', 'create'),
      match('pages', 'navigate'),
    ]);

    expect(groups.flatMap(group => group.matches.map(m => m.index))).toEqual([
      0, 1, 2,
    ]);
    expect(groups[1].matches[0].command.id).toBe('createArticle');
    expect(groups[1].matches[0].index).toBe(2);
  });
});
