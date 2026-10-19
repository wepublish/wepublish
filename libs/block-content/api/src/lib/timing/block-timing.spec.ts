import { BlockType } from '../block-type.model';
import {
  isDisplayedAt,
  nextTimingChange,
  shouldDisplayBlock,
} from './block-timing';
import { BlockTiming, Weekday } from './block-timing.model';

const ZURICH = 'Europe/Zurich';

const at = (iso: string) => new Date(iso);

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
});
