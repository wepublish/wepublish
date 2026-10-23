import { runInThisContext } from 'vm';
import {
  addCalendarDays,
  instantToZurichWallClock,
  isoWeekday,
  ZurichWallClock,
  zurichWallClockToInstant,
} from './zurich-time';

const hostProcessEnv: NodeJS.ProcessEnv = runInThisContext('process.env');

const wallClock = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): ZurichWallClock => ({
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond,
});

const iso = (wallClockValue: ZurichWallClock, reference?: Date) =>
  zurichWallClockToInstant(wallClockValue, reference).toISOString();

describe('instantToZurichWallClock', () => {
  it('reads winter instants with the CET offset', () => {
    expect(
      instantToZurichWallClock(new Date('2026-01-23T19:00:00.000Z'))
    ).toEqual(wallClock(2026, 1, 23, 20, 0));
  });

  it('reads summer instants with the CEST offset', () => {
    expect(
      instantToZurichWallClock(new Date('2026-07-03T18:00:00.000Z'))
    ).toEqual(wallClock(2026, 7, 3, 20, 0));
  });

  it('keeps seconds and milliseconds', () => {
    expect(
      instantToZurichWallClock(new Date('2026-05-02T09:00:30.500Z'))
    ).toEqual(wallClock(2026, 5, 2, 11, 0, 30, 500));
  });

  it('reads midnight as hour 0 on the new day', () => {
    expect(
      instantToZurichWallClock(new Date('2026-05-01T22:00:00.000Z'))
    ).toEqual(wallClock(2026, 5, 2, 0, 0));
  });

  it('crosses the year boundary in Zurich before it does in UTC', () => {
    expect(
      instantToZurichWallClock(new Date('2026-12-31T23:30:00.000Z'))
    ).toEqual(wallClock(2027, 1, 1, 0, 30));
  });
});

describe('zurichWallClockToInstant', () => {
  it.each([
    [wallClock(2026, 3, 28, 11), '2026-03-28T10:00:00.000Z'],
    [wallClock(2026, 4, 4, 11), '2026-04-04T09:00:00.000Z'],
    [wallClock(2026, 10, 24, 11), '2026-10-24T09:00:00.000Z'],
    [wallClock(2026, 10, 31, 11), '2026-10-31T10:00:00.000Z'],
    [wallClock(2026, 5, 2, 11, 0, 30, 500), '2026-05-02T09:00:30.500Z'],
  ])('converts %o to %s', (input, expected) => {
    expect(iso(input)).toBe(expected);
  });

  describe('in the spring gap', () => {
    it('moves a time that does not exist forward by the gap', () => {
      expect(iso(wallClock(2026, 3, 29, 2, 30))).toBe(
        '2026-03-29T01:30:00.000Z'
      );
    });

    it('moves 02:00 to the transition instant', () => {
      expect(iso(wallClock(2026, 3, 29, 2, 0))).toBe(
        '2026-03-29T01:00:00.000Z'
      );
    });

    it('resolves 03:00 to the transition instant', () => {
      expect(iso(wallClock(2026, 3, 29, 3, 0))).toBe(
        '2026-03-29T01:00:00.000Z'
      );
    });

    it('moves forward whatever the reference offset is', () => {
      expect(
        iso(wallClock(2026, 3, 29, 2, 30), new Date('2026-03-29T02:00:00.000Z'))
      ).toBe('2026-03-29T01:30:00.000Z');
      expect(
        iso(wallClock(2026, 3, 29, 2, 30), new Date('2026-03-28T23:00:00.000Z'))
      ).toBe('2026-03-29T01:30:00.000Z');
    });

    it('resolves 01:59 before the gap with the CET offset', () => {
      expect(iso(wallClock(2026, 3, 29, 1, 59))).toBe(
        '2026-03-29T00:59:00.000Z'
      );
    });
  });

  describe('in the autumn overlap', () => {
    it('takes the earlier instant without a reference', () => {
      expect(iso(wallClock(2026, 10, 25, 2, 30))).toBe(
        '2026-10-25T00:30:00.000Z'
      );
    });

    it('keeps the CEST offset of a summer reference', () => {
      expect(
        iso(
          wallClock(2026, 10, 25, 2, 30),
          new Date('2026-10-24T23:00:00.000Z')
        )
      ).toBe('2026-10-25T00:30:00.000Z');
    });

    it('keeps the CET offset of a winter reference', () => {
      expect(
        iso(
          wallClock(2026, 10, 25, 2, 30),
          new Date('2026-10-25T21:00:00.000Z')
        )
      ).toBe('2026-10-25T01:30:00.000Z');
    });

    it('resolves 03:00 to the only instant it has', () => {
      expect(iso(wallClock(2026, 10, 25, 3, 0))).toBe(
        '2026-10-25T02:00:00.000Z'
      );
      expect(
        iso(wallClock(2026, 10, 25, 3, 0), new Date('2026-10-24T23:00:00.000Z'))
      ).toBe('2026-10-25T02:00:00.000Z');
    });

    it('ignores the reference for an unambiguous time', () => {
      expect(
        iso(
          wallClock(2026, 10, 25, 22, 0),
          new Date('2026-10-24T20:00:00.000Z')
        )
      ).toBe('2026-10-25T21:00:00.000Z');
    });
  });

  it.each([
    ['2026-03-28T00:00:00.000Z', '2026-03-30T23:00:00.000Z'],
    ['2026-10-24T00:00:00.000Z', '2026-10-26T23:00:00.000Z'],
  ])('round-trips every hour from %s to %s', (fromIso, toIso) => {
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();

    for (let time = from; time <= to; time += 60 * 60 * 1000) {
      const instant = new Date(time + 12_345);

      expect(
        zurichWallClockToInstant(instantToZurichWallClock(instant), instant)
      ).toEqual(instant);
    }
  });
});

describe('isoWeekday', () => {
  it.each([
    [wallClock(2026, 3, 29), 7],
    [wallClock(2026, 3, 30), 1],
    [wallClock(2026, 12, 28), 1],
    [wallClock(2026, 5, 2), 6],
    [wallClock(2028, 2, 29), 2],
  ])('gives %o the ISO weekday %i', (input, expected) => {
    expect(isoWeekday(input)).toBe(expected);
  });
});

describe('addCalendarDays', () => {
  it('walks through a leap day', () => {
    const start = wallClock(2028, 2, 28, 11, 15, 30, 500);

    expect(addCalendarDays(start, 1)).toEqual(
      wallClock(2028, 2, 29, 11, 15, 30, 500)
    );
    expect(addCalendarDays(start, 2)).toEqual(
      wallClock(2028, 3, 1, 11, 15, 30, 500)
    );
  });

  it('skips February 29 in a common year', () => {
    expect(addCalendarDays(wallClock(2027, 2, 28, 9), 1)).toEqual(
      wallClock(2027, 3, 1, 9)
    );
  });

  it('crosses the year boundary', () => {
    expect(addCalendarDays(wallClock(2026, 12, 31, 20), 1)).toEqual(
      wallClock(2027, 1, 1, 20)
    );
  });

  it('keeps the wall clock across the DST change', () => {
    expect(addCalendarDays(wallClock(2026, 3, 28, 2, 30), 1)).toEqual(
      wallClock(2026, 3, 29, 2, 30)
    );
  });

  it('does not mutate its input', () => {
    const start = wallClock(2026, 1, 1, 10);

    addCalendarDays(start, 5);

    expect(start).toEqual(wallClock(2026, 1, 1, 10));
  });
});

describe.each([
  ['UTC', 0],
  ['Europe/Zurich', -120],
  ['America/New_York', 240],
  ['Asia/Tokyo', -540],
])('with the host process in %s', (timeZone, summerTimezoneOffset) => {
  const previousTimeZone = hostProcessEnv['TZ'];

  beforeAll(() => {
    hostProcessEnv['TZ'] = timeZone;
  });

  afterAll(() => {
    if (previousTimeZone === undefined) {
      delete hostProcessEnv['TZ'];
    } else {
      hostProcessEnv['TZ'] = previousTimeZone;
    }
  });

  it('runs in that zone', () => {
    expect(new Date('2026-07-03T18:00:00.000Z').getTimezoneOffset()).toBe(
      summerTimezoneOffset
    );
  });

  it('converts the same way', () => {
    expect(iso(wallClock(2026, 3, 28, 11))).toBe('2026-03-28T10:00:00.000Z');
    expect(iso(wallClock(2026, 4, 4, 11))).toBe('2026-04-04T09:00:00.000Z');
    expect(iso(wallClock(2026, 3, 29, 2, 30))).toBe('2026-03-29T01:30:00.000Z');
    expect(iso(wallClock(2026, 10, 25, 2, 30))).toBe(
      '2026-10-25T00:30:00.000Z'
    );
    expect(
      instantToZurichWallClock(new Date('2026-07-03T18:00:00.000Z'))
    ).toEqual(wallClock(2026, 7, 3, 20, 0));
    expect(isoWeekday(wallClock(2026, 3, 29))).toBe(7);
    expect(addCalendarDays(wallClock(2026, 3, 28, 2, 30), 1)).toEqual(
      wallClock(2026, 3, 29, 2, 30)
    );
  });
});
