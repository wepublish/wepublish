import { Weekday } from '@wepublish/editor/api';

import {
  blockVisibilityFlags,
  blockVisibilitySchema,
  setBlockVisibility,
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

describe('setBlockVisibility', () => {
  it('merges a change into the current value', () => {
    expect(
      setBlockVisibility({ breakpoints: ['xs'] }, { disabled: true })
    ).toEqual({ disabled: true, breakpoints: ['xs'] });
  });

  it('drops cleared settings and leaves nothing once all are cleared', () => {
    expect(
      setBlockVisibility(
        { disabled: true, breakpoints: ['xs'] },
        { disabled: undefined }
      )
    ).toEqual({ breakpoints: ['xs'] });
    expect(
      setBlockVisibility({ disabled: true }, { disabled: undefined })
    ).toBeUndefined();
  });

  it('drops a timing window that does not limit anything', () => {
    expect(
      setBlockVisibility(
        { timings: { weekdays: [Weekday.Monday] } },
        { timings: { weekdays: [], timeOfDay: null } }
      )
    ).toBeUndefined();
  });

  it('keeps a block hidden on every screen size', () => {
    expect(setBlockVisibility(undefined, { breakpoints: [] })).toEqual({
      breakpoints: [],
    });
  });
});
