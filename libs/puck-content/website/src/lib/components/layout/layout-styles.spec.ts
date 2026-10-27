import { createTheme } from '@mui/material';

import { gapStyles } from './gap';
import { cssStyles } from './with-css';

const theme = createTheme();

describe('cssStyles', () => {
  it('draws the border width per side with one style and colour', () => {
    expect(
      cssStyles(theme, {
        border: {
          width: { top: 2, bottom: 2, left: 1 },
          style: 'dashed',
          color: 'primary.main',
        },
      })
    ).toEqual({
      borderTop: `2px dashed ${theme.palette.primary.main}`,
      borderBottom: `2px dashed ${theme.palette.primary.main}`,
      borderLeft: `1px dashed ${theme.palette.primary.main}`,
    });
  });

  it('defaults the border to a solid line in the text colour', () => {
    expect(cssStyles(theme, { border: { width: { top: 1 } } })).toEqual({
      borderTop: '1px solid currentColor',
    });
  });

  it('applies the padding per side', () => {
    expect(
      cssStyles(theme, { padding: { top: 8, right: 16, bottom: 8, left: 0 } })
    ).toEqual({
      paddingTop: '8px',
      paddingRight: '16px',
      paddingBottom: '8px',
      paddingLeft: '0px',
    });
  });
});

describe('gapStyles', () => {
  it('maps the row and column gap', () => {
    expect(gapStyles({ gap: { row: 8, column: 24 } })).toEqual({
      rowGap: 8,
      columnGap: 24,
    });
    expect(gapStyles(undefined)).toEqual({
      rowGap: undefined,
      columnGap: undefined,
    });
  });
});
