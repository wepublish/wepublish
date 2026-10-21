import { fuzzyMatch } from './fuzzyMatch';

const score = (query: string, text: string) => fuzzyMatch(query, text)?.score;

describe('fuzzyMatch', () => {
  it('matches an empty query against anything without indices', () => {
    expect(fuzzyMatch('', 'Articles')).toEqual({ score: 0, indices: [] });
  });

  it('returns null when a character is missing', () => {
    expect(fuzzyMatch('xyz', 'Articles')).toBeNull();
  });

  it('matches characters out of order only when they appear in order', () => {
    expect(fuzzyMatch('acl', 'Articles')).not.toBeNull();
    expect(fuzzyMatch('lca', 'Articles')).toBeNull();
  });

  it('ignores case', () => {
    expect(fuzzyMatch('ART', 'Articles')).not.toBeNull();
  });

  it('reports the matched positions so they can be highlighted', () => {
    expect(fuzzyMatch('art', 'Articles')?.indices).toEqual([0, 1, 2]);
  });

  it('picks the positions that read best rather than the first ones found', () => {
    expect(fuzzyMatch('ca', 'Create article')?.indices).toEqual([0, 7]);
  });

  it('ranks a prefix above a match in the middle', () => {
    expect(score('tag', 'Tags')!).toBeGreaterThan(score('tag', 'Vintage')!);
  });

  it('ranks word starts above matches inside a word', () => {
    expect(score('ct', 'Create tag')!).toBeGreaterThan(
      score('ct', 'Collected')!
    );
  });

  it('ranks a contiguous run above a scattered one', () => {
    expect(score('page', 'Pages')!).toBeGreaterThan(
      score('page', 'Payment methods geo')!
    );
  });

  it('ranks the shorter of two equally good titles higher', () => {
    expect(score('event', 'Events')!).toBeGreaterThan(
      score('event', 'Events importable list')!
    );
  });

  it('treats separators as word boundaries', () => {
    expect(score('bt', 'block-template')!).toBeGreaterThan(
      score('bt', 'abort')!
    );
  });
});
