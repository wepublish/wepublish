import { Weekday } from '@wepublish/editor/api';

import {
  blockVisibilityFlags,
  blockVisibilitySchema,
} from './block-visibility.field';

describe('blockVisibilitySchema', () => {
  it('accepts the disabled flag, a timing window and breakpoints', () => {
    expect(
      blockVisibilitySchema.safeParse({
        disabled: true,
        timings: {
          from: '2026-01-01T00:00:00.000Z',
          weekdays: [Weekday.Monday],
          timeOfDay: { from: '08:00', to: '12:00' },
        },
        breakpoints: ['md', 'lg'],
      }).success
    ).toBe(true);
  });

  it('rejects malformed times of day', () => {
    expect(
      blockVisibilitySchema.safeParse({
        timings: { timeOfDay: { from: '8 am', to: '12:00' } },
      }).success
    ).toBe(false);
  });
});

describe('blockVisibilityFlags', () => {
  it('reports what restricts a block', () => {
    expect(blockVisibilityFlags(undefined)).toEqual({
      disabled: false,
      timed: false,
      breakpoints: undefined,
    });
    expect(
      blockVisibilityFlags({
        disabled: true,
        timings: { weekdays: [Weekday.Friday] },
        breakpoints: ['xs'],
      })
    ).toEqual({ disabled: true, timed: true, breakpoints: ['xs'] });
  });

  it('ignores an empty timing window', () => {
    expect(blockVisibilityFlags({ timings: { weekdays: [] } }).timed).toBe(
      false
    );
  });
});
