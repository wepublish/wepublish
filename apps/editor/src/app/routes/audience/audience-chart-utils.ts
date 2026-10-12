type Datum = Record<string, unknown>;

const numberAt = (datum: Datum, key: string) => {
  const value = datum[key];

  return typeof value === 'number' ? value : 0;
};

export function segmentPlacement(datum: Datum, key: string, keys: string[]) {
  const filled = keys.filter(candidate => numberAt(datum, candidate) !== 0);

  return {
    innermost: filled[0] === key,
    outermost: filled[filled.length - 1] === key,
  };
}

export const netChange = (datum: Datum, keys: string[]) =>
  keys.reduce((sum, key) => sum + numberAt(datum, key), 0);

export function activeTrend(
  stats: { totalActiveSubscriptionCount?: number | null }[]
) {
  if (!stats.length) {
    return null;
  }

  const first = stats[0].totalActiveSubscriptionCount ?? 0;
  const latest = stats[stats.length - 1].totalActiveSubscriptionCount ?? 0;
  const delta = latest - first;

  return {
    first,
    latest,
    delta,
    ratio: first === 0 ? null : delta / first,
  };
}

const TICK_TARGET = 5;

export function niceTicks(min: number, max: number) {
  const flatSpan = Math.max(Math.abs(max) * 0.005, 1);
  const low = min === max ? min - flatSpan / 2 : min;
  const high = min === max ? max + flatSpan / 2 : max;
  const rough = (high - low) / TICK_TARGET;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(
    1,
    [1, 2, 5, 10]
      .map(factor => factor * magnitude)
      .find(candidate => candidate >= rough) ?? 10 * magnitude
  );
  const start = Math.floor(low / step) * step;
  const end = Math.ceil(high / step) * step;

  return Array.from(
    { length: Math.round((end - start) / step) + 1 },
    (_, index) => start + index * step
  );
}
