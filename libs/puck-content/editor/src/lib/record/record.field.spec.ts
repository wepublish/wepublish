import {
  canAddRecord,
  canRemoveRecord,
  clampRecordIds,
  matchesRecordQuery,
  moveRecordId,
  recordField,
  recordFieldAi,
  recordSchema,
  recordStatusOf,
  removeRecordId,
  toggleRecordId,
  toRecordIds,
} from './record.field';

describe('record field', () => {
  describe('toRecordIds', () => {
    it('wraps a single id and drops empty values', () => {
      expect(toRecordIds('a')).toEqual(['a']);
      expect(toRecordIds('')).toEqual([]);
      expect(toRecordIds(undefined)).toEqual([]);
      expect(toRecordIds(null)).toEqual([]);
    });

    it('removes duplicates and empty entries from a list', () => {
      expect(toRecordIds(['a', '', 'b', 'a'])).toEqual(['a', 'b']);
    });
  });

  describe('toggleRecordId', () => {
    it('appends an id that is not selected yet', () => {
      expect(toggleRecordId(['a'], 'b')).toEqual(['a', 'b']);
    });

    it('removes an id that is already selected', () => {
      expect(toggleRecordId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    });

    it('does not add beyond the maximum but still removes', () => {
      expect(toggleRecordId(['a', 'b'], 'c', { max: 2 })).toEqual(['a', 'b']);
      expect(toggleRecordId(['a', 'b'], 'a', { max: 2 })).toEqual(['b']);
    });
  });

  it('removes an id', () => {
    expect(removeRecordId(['a', 'b', 'c'], 'a')).toEqual(['b', 'c']);
    expect(removeRecordId(['a'], 'x')).toEqual(['a']);
  });

  describe('moveRecordId', () => {
    it('moves an id to another position', () => {
      expect(moveRecordId(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
      expect(moveRecordId(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b']);
    });

    it('keeps the order when a position is out of range', () => {
      expect(moveRecordId(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
      expect(moveRecordId(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
    });
  });

  it('clamps ids to unique, non-empty values within the maximum', () => {
    expect(clampRecordIds(['a', 'a', '', 'b', 'c'], { max: 2 })).toEqual([
      'a',
      'b',
    ]);
    expect(clampRecordIds(['a', 'b'], {})).toEqual(['a', 'b']);
  });

  it('knows when a record can be added or removed', () => {
    expect(canAddRecord(['a'], { max: 2 })).toBe(true);
    expect(canAddRecord(['a', 'b'], { max: 2 })).toBe(false);
    expect(canAddRecord(['a', 'b'], {})).toBe(true);
    expect(canRemoveRecord(['a', 'b'], { min: 1 })).toBe(true);
    expect(canRemoveRecord(['a'], { min: 1 })).toBe(false);
    expect(canRemoveRecord(['a'], {})).toBe(true);
  });

  it('derives the status like the article editor does', () => {
    expect(
      recordStatusOf({
        pending: { id: 'p' },
        published: { id: 'x' },
        draft: { id: 'd' },
      })
    ).toBe('pending');
    expect(recordStatusOf({ published: { id: 'x' }, draft: { id: 'd' } })).toBe(
      'published'
    );
    expect(recordStatusOf({ draft: { id: 'd' }, published: null })).toBe(
      'draft'
    );
    expect(recordStatusOf({})).toBe('none');
  });

  it('matches a search query case-insensitively', () => {
    expect(matchesRecordQuery('Premium Abo', 'abo')).toBe(true);
    expect(matchesRecordQuery('Premium Abo', '  PREM ')).toBe(true);
    expect(matchesRecordQuery('Premium Abo', 'basic')).toBe(false);
    expect(matchesRecordQuery('Premium Abo', '')).toBe(true);
    expect(matchesRecordQuery(null, 'x')).toBe(false);
  });

  describe('recordSchema', () => {
    it('accepts a single id', () => {
      expect(recordSchema(false).safeParse('a').success).toBe(true);
      expect(recordSchema(false).safeParse(['a']).success).toBe(false);
    });

    it('accepts a bounded list of ids', () => {
      const schema = recordSchema(true, { min: 1, max: 2 });

      expect(schema.safeParse(['a']).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(false);
      expect(schema.safeParse(['a', 'b', 'c']).success).toBe(false);
    });
  });

  it('tells the AI to keep existing ids of the model', () => {
    const single = recordFieldAi('memberPlan', false);
    const multiple = recordFieldAi('author', true, { max: 3 });

    expect(single.instructions).toContain('member plan');
    expect(single.instructions).toContain('never invent');
    expect(single.schema).toMatchObject({ type: 'string' });
    expect(multiple.instructions).toContain('author');
    expect(multiple.schema).toMatchObject({ type: 'array', maxItems: 3 });
  });

  it('builds a field with matching AI parameters', () => {
    expect(
      recordField({ model: 'author', multiple: true, label: 'Authors', max: 5 })
    ).toEqual({
      type: 'record',
      model: 'author',
      multiple: true,
      label: 'Authors',
      max: 5,
      ai: recordFieldAi('author', true, { max: 5 }),
    });
    expect(recordField({ model: 'paywall' })).toMatchObject({
      type: 'record',
      model: 'paywall',
      multiple: false,
      ai: recordFieldAi('paywall', false),
    });
  });
});
