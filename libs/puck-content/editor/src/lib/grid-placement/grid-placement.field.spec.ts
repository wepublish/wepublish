import {
  gridLineRange,
  gridLineSchema,
  gridPlacementFieldAi,
  maxGridLineSpan,
  maxGridLineStart,
  setGridLine,
} from './grid-placement.field';

describe('grid line limits', () => {
  it('bounds a column line by the column count', () => {
    expect(maxGridLineStart('column')).toBe(12);
    expect(maxGridLineStart('column', 6)).toBe(6);
    expect(maxGridLineSpan('column', {})).toBe(12);
    expect(maxGridLineSpan('column', { start: 4 })).toBe(9);
    expect(maxGridLineSpan('column', { start: 4 }, 6)).toBe(3);
  });

  it('lets rows start anywhere and span up to twelve rows', () => {
    expect(maxGridLineStart('row')).toBeUndefined();
    expect(maxGridLineSpan('row', { start: 20 })).toBe(12);
  });
});

describe('setGridLine', () => {
  it('sets the start and the span', () => {
    expect(setGridLine('column', {}, 'start', 3)).toEqual({ start: 3 });
    expect(setGridLine('column', { start: 3 }, 'span', 4)).toEqual({
      start: 3,
      span: 4,
    });
  });

  it('clears a part when it is emptied', () => {
    expect(
      setGridLine('column', { start: 3, span: 4 }, 'start', undefined)
    ).toEqual({ span: 4 });
    expect(setGridLine('row', { span: 2 }, 'span', undefined)).toEqual({});
  });

  it('keeps the line inside the columns', () => {
    expect(setGridLine('column', {}, 'start', 20)).toEqual({ start: 12 });
    expect(setGridLine('column', { start: 9 }, 'span', 8)).toEqual({
      start: 9,
      span: 4,
    });
    expect(setGridLine('column', { span: 6 }, 'start', 10)).toEqual({
      start: 10,
      span: 3,
    });
    expect(setGridLine('column', {}, 'span', 9, 6)).toEqual({ span: 6 });
  });

  it('keeps rows within twelve and allows any start', () => {
    expect(setGridLine('row', {}, 'start', 30)).toEqual({ start: 30 });
    expect(setGridLine('row', { start: 30 }, 'span', 20)).toEqual({
      start: 30,
      span: 12,
    });
  });

  it('only stores whole lines starting at one', () => {
    expect(setGridLine('column', {}, 'start', 0)).toEqual({ start: 1 });
    expect(setGridLine('column', {}, 'span', -2)).toEqual({ span: 1 });
    expect(setGridLine('column', {}, 'span', 2.6)).toEqual({ span: 3 });
  });
});

describe('gridLineRange', () => {
  it('names the first and last line a placed cell covers', () => {
    expect(gridLineRange({ start: 3, span: 4 })).toEqual({ from: 3, to: 6 });
    expect(gridLineRange({ start: 3 })).toEqual({ from: 3, to: 3 });
  });

  it('has no range while the cell is placed automatically', () => {
    expect(gridLineRange({ span: 4 })).toBeUndefined();
    expect(gridLineRange(undefined)).toBeUndefined();
  });
});

describe('grid placement AI', () => {
  it('limits a column line to the columns', () => {
    expect(gridLineSchema('column', 6).parse({ start: 2, span: 5 })).toEqual({
      start: 2,
      span: 5,
    });
    expect(() => gridLineSchema('column', 6).parse({ start: 7 })).toThrow();
    expect(() => gridLineSchema('column').parse({ span: 13 })).toThrow();
    expect(() => gridLineSchema('row').parse({ span: 1.5 })).toThrow();
  });

  it('explains start and span of the axis', () => {
    expect(gridPlacementFieldAi('column').instructions).toContain(
      '12-column grid'
    );
    expect(gridPlacementFieldAi('row').instructions).toContain('rows');
    expect(gridPlacementFieldAi('column').schema).toMatchObject({
      type: 'object',
      properties: {
        start: { type: 'integer', minimum: 1, maximum: 12 },
        span: { type: 'integer', minimum: 1, maximum: 12 },
      },
    });
  });
});
