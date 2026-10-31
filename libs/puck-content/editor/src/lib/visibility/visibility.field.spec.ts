import { createTheme } from '@mui/material';

import {
  breakpointRanges,
  formatBreakpointRange,
  hiddenBreakpoints,
  isHiddenOn,
  toggleBreakpoint,
} from './visibility.field';

const all = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

describe('breakpointRanges', () => {
  it('spans each breakpoint up to the next one, smallest first', () => {
    expect(breakpointRanges(createTheme().breakpoints)).toEqual([
      { breakpoint: 'xs', min: 0, max: 599 },
      { breakpoint: 'sm', min: 600, max: 899 },
      { breakpoint: 'md', min: 900, max: 1199 },
      { breakpoint: 'lg', min: 1200, max: 1535 },
      { breakpoint: 'xl', min: 1536 },
    ]);
  });

  it('sorts breakpoints by their width, not by the key order', () => {
    expect(
      breakpointRanges({
        keys: ['md', 'xs', 'sm'],
        values: { xs: 0, sm: 500, md: 1000, lg: 1200, xl: 1500 },
      })
    ).toEqual([
      { breakpoint: 'xs', min: 0, max: 499 },
      { breakpoint: 'sm', min: 500, max: 999 },
      { breakpoint: 'md', min: 1000 },
    ]);
  });
});

describe('formatBreakpointRange', () => {
  it('formats a bounded range and the open-ended largest one', () => {
    expect(formatBreakpointRange({ breakpoint: 'xs', min: 0, max: 599 })).toBe(
      '0–599px'
    );
    expect(formatBreakpointRange({ breakpoint: 'xl', min: 1536 })).toBe(
      '1536px+'
    );
  });
});

describe('toggleBreakpoint', () => {
  it('hides a breakpoint of a block shown everywhere', () => {
    expect(toggleBreakpoint(undefined, 'md', [...all])).toEqual([
      'xs',
      'sm',
      'lg',
      'xl',
    ]);
  });

  it('shows a hidden breakpoint again in breakpoint order', () => {
    expect(toggleBreakpoint(['lg', 'xs'], 'sm', [...all])).toEqual([
      'xs',
      'sm',
      'lg',
    ]);
  });

  it('goes back to showing everywhere once every breakpoint is shown', () => {
    expect(
      toggleBreakpoint(['xs', 'sm', 'lg', 'xl'], 'md', [...all])
    ).toBeUndefined();
  });

  it('allows hiding the block on every breakpoint', () => {
    expect(toggleBreakpoint(['xs'], 'xs', [...all])).toEqual([]);
  });
});

describe('hiddenBreakpoints', () => {
  it('lists nothing when the block is shown everywhere', () => {
    expect(hiddenBreakpoints(undefined, [...all])).toEqual([]);
    expect(hiddenBreakpoints([...all], [...all])).toEqual([]);
  });

  it('lists the breakpoints missing from the value in breakpoint order', () => {
    expect(hiddenBreakpoints(['xl', 'xs', 'sm'], [...all])).toEqual([
      'md',
      'lg',
    ]);
  });
});

describe('isHiddenOn', () => {
  it('only hides breakpoints a value leaves out', () => {
    expect(isHiddenOn(undefined, 'xs')).toBe(false);
    expect(isHiddenOn(['xs'], 'xs')).toBe(false);
    expect(isHiddenOn(['xs'], 'md')).toBe(true);
  });
});
