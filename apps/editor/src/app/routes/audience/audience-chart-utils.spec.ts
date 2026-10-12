import {
  activeTrend,
  netChange,
  niceTicks,
  segmentPlacement,
} from './audience-chart-utils';

describe('segmentPlacement', () => {
  const keys = ['a', 'b', 'c'];

  it('marks the segment next to the baseline as innermost', () => {
    expect(segmentPlacement({ a: 3, b: 0, c: 2 }, 'a', keys)).toEqual({
      innermost: true,
      outermost: false,
    });
  });

  it('marks the last non-empty segment as outermost', () => {
    expect(segmentPlacement({ a: 3, b: 0, c: 2 }, 'c', keys)).toEqual({
      innermost: false,
      outermost: true,
    });
  });

  it('skips empty segments when looking for neighbours', () => {
    expect(segmentPlacement({ a: 0, b: -4, c: 0 }, 'b', keys)).toEqual({
      innermost: true,
      outermost: true,
    });
  });
});

describe('netChange', () => {
  it('adds gains and losses of the given series', () => {
    expect(
      netChange({ renewed: 4, created: 2, deactivated: -3, other: 99 }, [
        'renewed',
        'created',
        'deactivated',
        'missing',
      ])
    ).toBe(3);
  });
});

describe('activeTrend', () => {
  it('compares the latest value with the start of the range', () => {
    expect(
      activeTrend([
        { totalActiveSubscriptionCount: 100 },
        { totalActiveSubscriptionCount: 110 },
        { totalActiveSubscriptionCount: 121 },
      ])
    ).toEqual({ first: 100, latest: 121, delta: 21, ratio: 0.21 });
  });

  it('has no ratio when the range starts at zero', () => {
    expect(
      activeTrend([
        { totalActiveSubscriptionCount: 0 },
        { totalActiveSubscriptionCount: 5 },
      ])
    ).toEqual({ first: 0, latest: 5, delta: 5, ratio: null });
  });

  it('returns nothing without data', () => {
    expect(activeTrend([])).toBeNull();
  });
});

describe('niceTicks', () => {
  it('spans the data with round, evenly spaced ticks', () => {
    expect(niceTicks(1886, 1967)).toEqual([1880, 1900, 1920, 1940, 1960, 1980]);
  });

  it('puts a flat series between round ticks', () => {
    const ticks = niceTicks(1954, 1954);
    const step = ticks[1] - ticks[0];

    expect(ticks[0]).toBeLessThan(1954);
    expect(ticks[ticks.length - 1]).toBeGreaterThan(1954);
    expect(ticks.every(tick => Number.isInteger(tick))).toBe(true);
    expect(ticks.every((tick, index) => tick === ticks[0] + index * step)).toBe(
      true
    );
  });

  it('starts at zero for small counts', () => {
    expect(niceTicks(0, 7)).toEqual([0, 2, 4, 6, 8]);
  });
});
