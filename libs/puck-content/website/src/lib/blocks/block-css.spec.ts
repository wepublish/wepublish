import { createTheme } from '@mui/material';

import { puckBlockCss } from './block-css';

const theme = createTheme();

describe('puckBlockCss', () => {
  it('combines the styling and the breakpoint visibility of a block', () => {
    expect(
      puckBlockCss(
        theme,
        {
          styling: {
            xs: { margin: { top: 1, left: 2 }, opacity: 50 },
            md: { opacity: 80 },
          },
          visibility: { breakpoints: ['sm', 'md', 'lg', 'xl'] },
        },
        { marginSides: ['top', 'bottom'] }
      )
    ).toEqual({
      marginTop: theme.spacing(1),
      opacity: 0.5,
      [theme.breakpoints.up('md')]: {
        marginTop: theme.spacing(1),
        opacity: 0.8,
      },
      [theme.breakpoints.only('xs')]: { display: 'none' },
    });
  });

  it('keeps the styling of a breakpoint the block is hidden on', () => {
    expect(
      puckBlockCss(theme, {
        styling: { xl: { opacity: 50 } },
        visibility: { breakpoints: ['xs', 'sm', 'md', 'lg'] },
      })
    ).toEqual({
      [theme.breakpoints.up('xl')]: { opacity: 0.5, display: 'none' },
    });
  });

  it('renders nothing for a block without styling and visibility', () => {
    expect(puckBlockCss(theme, {})).toEqual({});
    expect(puckBlockCss(theme, { styling: null, visibility: null })).toEqual(
      {}
    );
  });
});
