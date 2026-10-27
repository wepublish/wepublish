import { createTheme } from '@mui/material';

import { resolveBreakpointValue } from './breakpoints.field';

const theme = createTheme();

describe('resolveBreakpointValue', () => {
  it('falls back to smaller breakpoints, mobile first', () => {
    expect(
      resolveBreakpointValue(
        theme,
        { xs: { gap: 16, columns: 1 }, md: { columns: 2 } },
        'lg'
      )
    ).toEqual({ gap: 16, columns: 2 });
  });

  it('keeps inheriting a sub value that a larger breakpoint left unset', () => {
    expect(
      resolveBreakpointValue(
        theme,
        { xs: { gap: 16 }, md: { gap: undefined, columns: 2 } },
        'md'
      )
    ).toEqual({ gap: 16, columns: 2 });
  });
});
