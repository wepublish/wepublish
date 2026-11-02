import { BlockType } from '../block-type.model';
import {
  assertValidTiming,
  isDisplayedAt,
  nextTimingChange,
  shouldDisplayBlock,
} from './block-timing';
import { BlockTiming, Weekday } from './block-timing.model';
import { formatInTimeZone } from 'date-fns-tz';

vi.mock('date-fns-tz', async importOriginal => {
  const original = await importOriginal<typeof import('date-fns-tz')>();

  return { ...original, formatInTimeZone: vi.fn(original.formatInTimeZone) };
});

const ZURICH = 'Europe/Zurich';

const at = (iso: string) => new Date(iso);

const stored = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const block = (overrides: { disabled?: boolean; timing?: BlockTiming } = {}) =>
  ({
    type: BlockType.Title,
    ...overrides,
  }) as Parameters<typeof shouldDisplayBlock>[0];

describe('isDisplayedAt', () => {
  it('displays a block without any timing', () => {
    expect(isDisplayedAt(undefined, at('2026-01-05T09:00:00Z'), ZURICH)).toBe(
      true
    );
    expect(isDisplayedAt(null, at('2026-01-05T09:00:00Z'), ZURICH)).toBe(true);
  });

  describe('date range', () => {
    const timing = {
      from: at('2026-01-05T00:00:00Z'),
      to: at('2026-01-07T00:00:00Z'),
    };

    it('hides before the range starts', () => {
      expect(isDisplayedAt(timing, at('2026-01-04T23:59:59Z'), ZURICH)).toBe(
        false
      );
    });

    it('displays inside the range', () => {
      expect(isDisplayedAt(timing, at('2026-01-05T00:00:00Z'), ZURICH)).toBe(
        true
      );
      expect(isDisplayedAt(timing, at('2026-01-06T12:00:00Z'), ZURICH)).toBe(
        true
      );
    });

    it('hides once the range ended', () => {
      expect(isDisplayedAt(timing, at('2026-01-07T00:00:00Z'), ZURICH)).toBe(
        false
      );
    });

    it('treats a missing bound as open ended', () => {
      expect(
        isDisplayedAt(
          { from: at('2026-01-05T00:00:00Z') },
          at('2030-01-01T00:00:00Z'),
          ZURICH
        )
      ).toBe(true);
      expect(
        isDisplayedAt(
          { to: at('2026-01-05T00:00:00Z') },
          at('1990-01-01T00:00:00Z'),
          ZURICH
        )
      ).toBe(true);
    });
  });

  describe('weekdays', () => {
    const timing = { weekdays: [Weekday.Monday, Weekday.Friday] };

    it('displays on a listed weekday', () => {
      // 2026-01-05 is a Monday
      expect(isDisplayedAt(timing, at('2026-01-05T09:00:00Z'), ZURICH)).toBe(
        true
      );
    });

    it('hides on an unlisted weekday', () => {
      expect(isDisplayedAt(timing, at('2026-01-06T09:00:00Z'), ZURICH)).toBe(
        false
      );
    });

    it('uses the weekday in the configured timezone', () => {
      // Monday 00:30 in Zurich is still Sunday 23:30 UTC
      expect(isDisplayedAt(timing, at('2026-01-04T23:30:00Z'), ZURICH)).toBe(
        true
      );
    });
  });

  describe('time of day', () => {
    it('displays within the window', () => {
      const timing = { timeOfDay: { from: '08:00', to: '17:00' } };

      expect(isDisplayedAt(timing, at('2026-01-05T07:00:00Z'), ZURICH)).toBe(
        true
      );
      expect(isDisplayedAt(timing, at('2026-01-05T06:59:00Z'), ZURICH)).toBe(
        false
      );
      expect(isDisplayedAt(timing, at('2026-01-05T16:00:00Z'), ZURICH)).toBe(
        false
      );
    });

    it('supports a window wrapping over midnight', () => {
      const timing = { timeOfDay: { from: '22:00', to: '02:00' } };

      expect(isDisplayedAt(timing, at('2026-01-05T21:30:00Z'), ZURICH)).toBe(
        true
      );
      expect(isDisplayedAt(timing, at('2026-01-06T00:30:00Z'), ZURICH)).toBe(
        true
      );
      expect(isDisplayedAt(timing, at('2026-01-05T12:00:00Z'), ZURICH)).toBe(
        false
      );
    });
  });

  it('asks every part of the window to apply at once', () => {
    const timing = {
      from: at('2026-01-01T00:00:00Z'),
      to: at('2026-02-01T00:00:00Z'),
      weekdays: [Weekday.Monday],
      timeOfDay: { from: '08:00', to: '17:00' },
    };

    // Monday 10:00 Zurich, inside the date range
    expect(isDisplayedAt(timing, at('2026-01-05T09:00:00Z'), ZURICH)).toBe(
      true
    );
    // Monday 07:00 Zurich, outside the time of day
    expect(isDisplayedAt(timing, at('2026-01-05T06:00:00Z'), ZURICH)).toBe(
      false
    );
    // Tuesday 10:00 Zurich, wrong weekday
    expect(isDisplayedAt(timing, at('2026-01-06T09:00:00Z'), ZURICH)).toBe(
      false
    );
    // Monday 10:00 Zurich, after the date range
    expect(isDisplayedAt(timing, at('2026-02-02T09:00:00Z'), ZURICH)).toBe(
      false
    );
  });
});

describe('isDisplayedAt with stored timings', () => {
  it('enforces a date range read back from the database as strings', () => {
    const timing = stored({
      from: at('2026-01-05T00:00:00Z'),
      to: at('2026-01-07T00:00:00Z'),
    });

    expect(isDisplayedAt(timing, at('2026-01-04T12:00:00Z'), ZURICH)).toBe(
      false
    );
    expect(isDisplayedAt(timing, at('2026-01-06T12:00:00Z'), ZURICH)).toBe(
      true
    );
    expect(isDisplayedAt(timing, at('2026-01-08T12:00:00Z'), ZURICH)).toBe(
      false
    );
  });

  it('hides a block whose stored timing cannot be read', () => {
    expect(
      isDisplayedAt(
        { timeOfDay: { from: '9:00', to: '17:00' } },
        at('2026-01-05T09:00:00Z'),
        ZURICH
      )
    ).toBe(false);
    expect(
      isDisplayedAt(
        { from: 'tomorrow' as unknown as Date },
        at('2026-01-05T09:00:00Z'),
        ZURICH
      )
    ).toBe(false);
  });

  it('counts the part of a window after midnight to the weekday it started on', () => {
    const timing = {
      weekdays: [Weekday.Friday],
      timeOfDay: { from: '22:00', to: '02:00' },
    };

    // 2026-01-09 is a Friday, 2026-01-10 01:00 Zurich is Saturday 00:00 UTC
    expect(isDisplayedAt(timing, at('2026-01-09T21:30:00Z'), ZURICH)).toBe(
      true
    );
    expect(isDisplayedAt(timing, at('2026-01-10T00:00:00Z'), ZURICH)).toBe(
      true
    );
    // Friday 01:00 Zurich belongs to Thursday's window
    expect(isDisplayedAt(timing, at('2026-01-09T00:00:00Z'), ZURICH)).toBe(
      false
    );
  });
});

describe('assertValidTiming', () => {
  it('accepts a complete timing', () => {
    expect(() =>
      assertValidTiming({
        from: at('2026-01-05T00:00:00Z'),
        to: at('2026-01-06T00:00:00Z'),
        weekdays: [Weekday.Monday],
        timeOfDay: { from: '22:00', to: '02:00' },
      })
    ).not.toThrow();
    expect(() => assertValidTiming(null)).not.toThrow();
  });

  it('rejects times that are not HH:mm', () => {
    for (const time of ['9:00', '24:00', '12:60', '', 'noon']) {
      expect(() =>
        assertValidTiming({ timeOfDay: { from: time, to: '17:00' } })
      ).toThrow();
    }
  });

  it('accepts an empty daily window, which never displays', () => {
    const timing = { timeOfDay: { from: '08:00', to: '08:00' } };

    expect(() => assertValidTiming(timing)).not.toThrow();
    expect(isDisplayedAt(timing, at('2026-01-05T07:00:00Z'), ZURICH)).toBe(
      false
    );
  });

  it('rejects a date range that ends before it starts', () => {
    expect(() =>
      assertValidTiming({
        from: at('2026-01-06T00:00:00Z'),
        to: at('2026-01-06T00:00:00Z'),
      })
    ).toThrow();
  });
});

describe('shouldDisplayBlock', () => {
  it('hides a disabled block regardless of its timing', () => {
    expect(
      shouldDisplayBlock(block({ disabled: true }), at('2026-01-05T09:00:00Z'))
    ).toBe(false);
  });

  it('displays an enabled block without timing', () => {
    expect(shouldDisplayBlock(block(), at('2026-01-05T09:00:00Z'))).toBe(true);
  });

  it('hides an enabled block outside its timing', () => {
    expect(
      shouldDisplayBlock(
        block({ timing: { from: at('2026-02-01T00:00:00Z') } as BlockTiming }),
        at('2026-01-05T09:00:00Z')
      )
    ).toBe(false);
  });
});

describe('nextTimingChange', () => {
  it('returns null when no block is timed', () => {
    expect(
      nextTimingChange(
        [block(), block({ disabled: true })],
        at('2026-01-05T09:00:00Z')
      )
    ).toBeNull();
  });

  it('returns the start of an upcoming date range', () => {
    expect(
      nextTimingChange(
        [
          block({
            timing: { from: at('2026-01-05T12:00:00Z') } as BlockTiming,
          }),
        ],
        at('2026-01-05T09:00:00Z')
      )
    ).toEqual(at('2026-01-05T12:00:00Z'));
  });

  it('returns the end of a running date range', () => {
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              from: at('2026-01-05T08:00:00Z'),
              to: at('2026-01-05T18:00:00Z'),
            } as BlockTiming,
          }),
        ],
        at('2026-01-05T09:00:00Z')
      )
    ).toEqual(at('2026-01-05T18:00:00Z'));
  });

  it('returns the earliest change across all blocks', () => {
    expect(
      nextTimingChange(
        [
          block({
            timing: { from: at('2026-01-05T18:00:00Z') } as BlockTiming,
          }),
          block({
            timing: { from: at('2026-01-05T12:00:00Z') } as BlockTiming,
          }),
        ],
        at('2026-01-05T09:00:00Z')
      )
    ).toEqual(at('2026-01-05T12:00:00Z'));
  });

  it('returns the next edge of a time of day window', () => {
    // 09:00 UTC is 10:00 in Zurich, so the window closes at 17:00 Zurich = 16:00 UTC
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              timeOfDay: { from: '08:00', to: '17:00' },
            } as BlockTiming,
          }),
        ],
        at('2026-01-05T09:00:00Z'),
        ZURICH
      )
    ).toEqual(at('2026-01-05T16:00:00Z'));
  });

  it('returns the next local midnight for a weekday only rule', () => {
    expect(
      nextTimingChange(
        [block({ timing: { weekdays: [Weekday.Monday] } as BlockTiming })],
        at('2026-01-05T09:00:00Z'),
        ZURICH
      )
    ).toEqual(at('2026-01-05T23:00:00Z'));
  });

  it('ignores changes past the horizon', () => {
    expect(
      nextTimingChange(
        [
          block({
            timing: { from: at('2026-03-01T00:00:00Z') } as BlockTiming,
          }),
        ],
        at('2026-01-05T09:00:00Z')
      )
    ).toBeNull();
  });

  it('looks into nested blocks', () => {
    const nested = {
      type: BlockType.FlexBlock,
      blocks: [
        {
          block: block({
            timing: { from: at('2026-01-05T12:00:00Z') } as BlockTiming,
          }),
        },
      ],
    } as Parameters<typeof nextTimingChange>[0][number];

    expect(nextTimingChange([nested], at('2026-01-05T09:00:00Z'))).toEqual(
      at('2026-01-05T12:00:00Z')
    );
  });

  it('reads date ranges stored as strings', () => {
    expect(
      nextTimingChange(
        stored([
          block({
            timing: {
              from: at('2026-01-05T08:00:00Z'),
              to: at('2026-01-05T18:00:00Z'),
            } as BlockTiming,
          }),
        ]),
        at('2026-01-05T09:00:00Z')
      )
    ).toEqual(at('2026-01-05T18:00:00Z'));
  });

  it('ignores timings it cannot read instead of failing', () => {
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              timeOfDay: { from: 'noon', to: '17:00' },
            } as BlockTiming,
          }),
        ],
        at('2026-01-05T09:00:00Z'),
        ZURICH
      )
    ).toBeNull();
  });

  it('ignores the timing of a disabled block', () => {
    expect(
      nextTimingChange(
        [
          block({
            disabled: true,
            timing: { from: at('2026-01-05T12:00:00Z') } as BlockTiming,
          }),
        ],
        at('2026-01-05T09:00:00Z')
      )
    ).toBeNull();
  });

  it('ignores changes inside a block that stays hidden', () => {
    const parent = {
      type: BlockType.FlexBlock,
      timing: { from: at('2026-01-05T15:00:00Z') },
      blocks: [
        {
          block: block({
            timing: { from: at('2026-01-05T12:00:00Z') } as BlockTiming,
          }),
        },
      ],
    } as Parameters<typeof nextTimingChange>[0][number];

    expect(nextTimingChange([parent], at('2026-01-05T09:00:00Z'))).toEqual(
      at('2026-01-05T15:00:00Z')
    );
  });

  it('ends a window that wrapped past midnight on the next day', () => {
    // Friday 23:00 Zurich, the window runs until Saturday 02:00 Zurich
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              weekdays: [Weekday.Friday],
              timeOfDay: { from: '22:00', to: '02:00' },
            } as BlockTiming,
          }),
        ],
        at('2026-01-09T22:00:00Z'),
        ZURICH
      )
    ).toEqual(at('2026-01-10T01:00:00Z'));
  });

  it('does not skip the day the clocks spring forward', () => {
    // Saturday 23:30 Zurich, the clocks spring forward on Sunday 2026-03-29
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              timeOfDay: { from: '08:00', to: '17:00' },
            } as BlockTiming,
          }),
        ],
        at('2026-03-28T22:30:00Z'),
        ZURICH
      )
    ).toEqual(at('2026-03-29T06:00:00Z'));
  });

  it('opens a window starting inside the skipped hour once the clocks jump', () => {
    // 02:30 does not exist on 2026-03-29 in Zurich, 03:00 CEST is 01:00 UTC
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              timeOfDay: { from: '02:30', to: '05:00' },
            } as BlockTiming,
          }),
        ],
        at('2026-03-28T23:30:00Z'),
        ZURICH
      )
    ).toEqual(at('2026-03-29T01:00:00Z'));
  });

  it('finds the clock jump to the millisecond', () => {
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              timeOfDay: { from: '02:30', to: '03:30' },
            } as BlockTiming,
          }),
        ],
        at('2026-03-29T00:10:00.123Z'),
        ZURICH
      )
    ).toEqual(at('2026-03-29T01:00:00Z'));
  });

  it('opens a window on the first of two repeated half hours', () => {
    // Lord Howe falls back from 02:00 +11:00 to 01:30 +10:30, 01:40 first happens at 14:40 UTC
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              timeOfDay: { from: '01:40', to: '01:50' },
            } as BlockTiming,
          }),
        ],
        at('2026-04-04T13:00:00.500Z'),
        'Australia/Lord_Howe'
      )
    ).toEqual(at('2026-04-04T14:40:00Z'));
  });

  it('reads the clock once per moment it checks, not once per block', () => {
    const blocks = Array.from({ length: 200 }, (_, index) =>
      block(
        index % 4 ?
          {}
        : {
            timing: {
              weekdays: [Weekday.Saturday, Weekday.Sunday],
              timeOfDay: { from: `0${index % 10}:15`, to: '20:00' },
            } as BlockTiming,
          }
      )
    );
    vi.mocked(formatInTimeZone).mockClear();

    expect(
      nextTimingChange(blocks, at('2026-10-26T09:00:00Z'), ZURICH)
    ).toBeNull();
    expect(vi.mocked(formatInTimeZone).mock.calls.length).toBeLessThan(150);
  });

  it('opens a window on the first of two repeated hours', () => {
    // 02:30 happens twice on 2026-10-25 in Zurich, first at 00:30 UTC
    expect(
      nextTimingChange(
        [
          block({
            timing: {
              timeOfDay: { from: '02:30', to: '05:00' },
            } as BlockTiming,
          }),
        ],
        at('2026-10-24T22:00:00Z'),
        ZURICH
      )
    ).toEqual(at('2026-10-25T00:30:00Z'));
  });
});
