import {
  getSidesMode,
  setAllSides,
  setAxis,
  setSide,
  sidesModesFor,
  sidesSchema,
  toSidesMode,
} from './sides';

const vertical = ['top', 'bottom'] as const;

describe('getSidesMode', () => {
  it('detects a uniform value', () => {
    expect(getSidesMode(undefined)).toBe('all');
    expect(getSidesMode({ top: 8, right: 8, bottom: 8, left: 8 })).toBe('all');
  });

  it('detects matching vertical and horizontal sides', () => {
    expect(getSidesMode({ top: 8, right: 16, bottom: 8, left: 16 })).toBe(
      'axis'
    );
  });

  it('falls back to individual sides', () => {
    expect(getSidesMode({ top: 8, right: 16, bottom: 4, left: 16 })).toBe(
      'individual'
    );
  });
});

describe('setters', () => {
  it('sets every side at once', () => {
    expect(setAllSides(12)).toEqual({
      top: 12,
      right: 12,
      bottom: 12,
      left: 12,
    });
    expect(setAllSides(undefined)).toEqual({});
  });

  it('sets the vertical or horizontal sides', () => {
    expect(
      setAxis({ top: 1, right: 2, bottom: 3, left: 4 }, 'vertical', 8)
    ).toEqual({
      top: 8,
      right: 2,
      bottom: 8,
      left: 4,
    });
    expect(setAxis({ top: 1 }, 'horizontal', 8)).toEqual({
      top: 1,
      right: 8,
      left: 8,
    });
  });

  it('sets and clears a single side', () => {
    expect(setSide({ top: 1, left: 2 }, 'left', 6)).toEqual({
      top: 1,
      left: 6,
    });
    expect(setSide({ top: 1, left: 2 }, 'left', undefined)).toEqual({ top: 1 });
  });
});

describe('toSidesMode', () => {
  it('unifies the sides when switching to fewer inputs', () => {
    const value = { top: 4, right: 8, bottom: 2, left: 6 };

    expect(toSidesMode(value, 'all')).toEqual(setAllSides(4));
    expect(toSidesMode(value, 'axis')).toEqual({
      top: 4,
      right: 8,
      bottom: 4,
      left: 8,
    });
    expect(toSidesMode(value, 'individual')).toBe(value);
  });
});

describe('restricted sides', () => {
  it('only describes the allowed sides in the schema', () => {
    expect(
      Object.keys(sidesSchema('margin', 'spacing', [...vertical]).shape)
    ).toEqual(['top', 'bottom']);
  });

  it('drops the axis mode when not every side is allowed', () => {
    expect(sidesModesFor([...vertical])).toEqual(['all', 'individual']);
    expect(sidesModesFor(undefined)).toEqual(['all', 'axis', 'individual']);
  });

  it('only sets and compares the allowed sides', () => {
    expect(setAllSides(2, [...vertical])).toEqual({ top: 2, bottom: 2 });
    expect(getSidesMode({ top: 2, bottom: 2 }, [...vertical])).toBe('all');
    expect(getSidesMode({ top: 2, bottom: 4 }, [...vertical])).toBe(
      'individual'
    );
    expect(toSidesMode({ top: 4, bottom: 2 }, 'all', [...vertical])).toEqual({
      top: 4,
      bottom: 4,
    });
  });
});
