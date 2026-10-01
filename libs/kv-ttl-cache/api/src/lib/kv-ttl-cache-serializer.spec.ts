import {
  deserializeCacheValue,
  serializeCacheValue,
} from './kv-ttl-cache-serializer';

const roundTrip = <T>(value: T) =>
  deserializeCacheValue<T>(serializeCacheValue(value));

describe('kv-ttl-cache serializer', () => {
  it('keeps nested dates as Date instances', () => {
    const createdAt = new Date('2026-01-02T03:04:05.678Z');
    const value = {
      value: {
        id: 'stripe',
        createdAt,
        history: [{ at: createdAt }, null],
      },
      expires: 1234,
    };

    const result = roundTrip(value);

    expect(result.value.createdAt).toBeInstanceOf(Date);
    expect(result.value.createdAt.toISOString()).toBe(createdAt.toISOString());
    expect(result.value.history[0]?.at).toBeInstanceOf(Date);
    expect(result).toEqual(value);
  });

  it('keeps a top level date as a Date instance', () => {
    const date = new Date('2026-05-06T07:08:09.000Z');

    expect(roundTrip(date)).toEqual(date);
  });

  it('does not turn date-like strings into dates', () => {
    const value = { note: '2026-01-02T03:04:05.678Z' };

    expect(roundTrip(value)).toEqual(value);
  });

  it('keeps an invalid date invalid', () => {
    const result = roundTrip({ at: new Date(Number.NaN) });

    expect(result.at).toBeInstanceOf(Date);
    expect(Number.isNaN(result.at.getTime())).toBe(true);
  });

  it('round trips plain JSON values unchanged', () => {
    const value = {
      text: 'a',
      count: 1,
      flag: false,
      empty: null,
      list: [1, 'two', { three: 3 }],
    };

    expect(roundTrip(value)).toEqual(value);
  });
});
