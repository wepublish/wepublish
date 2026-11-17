import { fuzzyMatch } from './fuzzyMatch';

const SECTION_WEIGHT = 0.8;
const KEYWORD_WEIGHT = 0.5;

export interface FuzzySearchFields {
  title: string;
  /** Matched as «section title», so «email trans» finds «Transactional email» in «Email». */
  section?: string;
  keywords?: string[];
}

export interface FuzzySearchMatch<T> {
  item: T;
  /** Matched characters of the title, for highlighting. */
  indices: number[];
}

const scoreOf = (query: string, text: string) =>
  fuzzyMatch(query, text)?.score ?? null;

const best = (a: number | null, b: number | null) =>
  a === null ? b
  : b === null ? a
  : Math.max(a, b);

/**
 * Ranks items by how well the query matches their title, their section and
 * title together, or one of their keywords, in that order of weight. An empty
 * query keeps every item in its order.
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  fieldsOf: (item: T) => FuzzySearchFields
): FuzzySearchMatch<T>[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return items.map(item => ({ item, indices: [] }));
  }

  return items
    .flatMap(item => {
      const { title, section, keywords = [] } = fieldsOf(item);
      const titleMatch = fuzzyMatch(trimmed, title);
      const qualified =
        section ? scoreOf(trimmed, `${section} ${title}`) : null;
      const keyword = keywords.reduce<number | null>(
        (highest, word) => best(highest, scoreOf(trimmed, word)),
        null
      );

      const score = best(
        best(
          titleMatch?.score ?? null,
          qualified === null ? null : qualified * SECTION_WEIGHT
        ),
        keyword === null ? null : keyword * KEYWORD_WEIGHT
      );

      if (score === null) {
        return [];
      }

      return [{ item, indices: titleMatch?.indices ?? [], score }];
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item, indices }) => ({ item, indices }));
}
