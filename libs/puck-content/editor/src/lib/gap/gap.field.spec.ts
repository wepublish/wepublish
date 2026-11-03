import { isGapLinked, setGap, setLinkedGap } from './gap.field';

describe('gap helpers', () => {
  it('treats equal row and column gaps as linked', () => {
    expect(isGapLinked(undefined)).toBe(true);
    expect(isGapLinked({ row: 16, column: 16 })).toBe(true);
    expect(isGapLinked({ row: 8, column: 16 })).toBe(false);
  });

  it('sets both gaps at once', () => {
    expect(setLinkedGap(12)).toEqual({ row: 12, column: 12 });
    expect(setLinkedGap(undefined)).toEqual({});
  });

  it('sets and clears a single gap', () => {
    expect(setGap({ row: 8, column: 8 }, 'column', 24)).toEqual({
      row: 8,
      column: 24,
    });
    expect(setGap({ row: 8, column: 8 }, 'row', undefined)).toEqual({
      column: 8,
    });
  });
});
