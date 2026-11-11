export interface FuzzyMatch {
  score: number;
  indices: number[];
}

const WORD_START_BONUS = 12;
const FIRST_CHARACTER_BONUS = 10;
const CONSECUTIVE_BONUS = 10;
const MATCH_SCORE = 2;
const GAP_PENALTY = 1;
const MAX_GAP_PENALTY = 6;
const LENGTH_PENALTY = 0.05;

const isSeparator = (character: string) => !/[\p{L}\p{N}]/u.test(character);

const wordStarts = (text: string) =>
  [...text].map((character, index) => {
    if (index === 0) {
      return true;
    }

    const previous = text[index - 1];

    return (
      isSeparator(previous) ||
      (character === character.toUpperCase() &&
        previous === previous.toLowerCase() &&
        !isSeparator(character))
    );
  });

export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  if (!query) {
    return { score: 0, indices: [] };
  }

  if (query.length > text.length) {
    return null;
  }

  const needle = query.toLowerCase();
  const haystack = text.toLowerCase();
  const starts = wordStarts(text);

  let best: (number | null)[] = [];
  const previous: (number | null)[][] = [];

  for (let queryIndex = 0; queryIndex < needle.length; queryIndex++) {
    const current: (number | null)[] = new Array(haystack.length).fill(null);
    const parents: (number | null)[] = new Array(haystack.length).fill(null);

    for (let textIndex = 0; textIndex < haystack.length; textIndex++) {
      if (haystack[textIndex] !== needle[queryIndex]) {
        continue;
      }

      const placement =
        MATCH_SCORE +
        (starts[textIndex] ? WORD_START_BONUS : 0) +
        (textIndex === 0 ? FIRST_CHARACTER_BONUS : 0);

      if (queryIndex === 0) {
        current[textIndex] = placement - Math.min(textIndex, MAX_GAP_PENALTY);
        continue;
      }

      for (let before = 0; before < textIndex; before++) {
        const previousScore = best[before];

        if (previousScore === null || previousScore === undefined) {
          continue;
        }

        const gap = textIndex - before - 1;
        const candidate =
          previousScore +
          placement +
          (gap === 0 ? CONSECUTIVE_BONUS : 0) -
          Math.min(gap * GAP_PENALTY, MAX_GAP_PENALTY);

        if (current[textIndex] === null || candidate > current[textIndex]!) {
          current[textIndex] = candidate;
          parents[textIndex] = before;
        }
      }
    }

    previous.push(parents);
    best = current;
  }

  let end: number | null = null;

  best.forEach((value, index) => {
    if (value !== null && (end === null || value > best[end]!)) {
      end = index;
    }
  });

  if (end === null) {
    return null;
  }

  const indices: number[] = [];
  let position: number | null = end;

  for (let queryIndex = needle.length - 1; queryIndex >= 0; queryIndex--) {
    indices.unshift(position!);
    position = previous[queryIndex][position!];
  }

  return {
    score: best[end]! - text.length * LENGTH_PENALTY,
    indices,
  };
}
