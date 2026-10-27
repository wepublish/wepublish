import {
  getSidesMode,
  setAllSides,
  setAxis,
  setSide,
  toSidesMode,
} from './sides';

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
