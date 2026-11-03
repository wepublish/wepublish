import { createTheme } from '@mui/material';

import { gapStyles } from './gap';

const theme = createTheme();

describe('gapStyles', () => {
  it('maps the row and column gap', () => {
    expect(gapStyles(theme, { gap: { row: 1, column: '24px' } })).toEqual({
      rowGap: theme.spacing(1),
      columnGap: '24px',
    });
    expect(gapStyles(theme, undefined)).toEqual({
      rowGap: undefined,
      columnGap: undefined,
    });
  });
});
