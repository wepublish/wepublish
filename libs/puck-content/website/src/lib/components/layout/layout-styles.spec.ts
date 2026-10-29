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

  it('applies the margin per side in spacing units or pixels', () => {
    expect(cssStyles(theme, { margin: { top: 3, bottom: '0px' } })).toEqual({
      marginTop: theme.spacing(3),
      marginBottom: '0px',
    });
  });

  it('ignores the margin on sides the component does not allow', () => {
    expect(
      cssStyles(theme, { margin: { top: 1, right: 2, left: 2 } }, [
        'top',
        'bottom',
      ])
    ).toEqual({
      marginTop: theme.spacing(1),
    });
  });

  it('applies the padding per side', () => {
    expect(
      cssStyles(theme, {
        padding: { top: 1, right: '12px', bottom: 1, left: 0 },
      })
    ).toEqual({
      paddingTop: theme.spacing(1),
      paddingRight: '12px',
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(0),
    });
  });
});

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
