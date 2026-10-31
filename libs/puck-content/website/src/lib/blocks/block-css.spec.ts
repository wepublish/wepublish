import { createTheme } from '@mui/material';

import { puckBlockCss } from './block-css';

const theme = createTheme();

describe('puckBlockCss', () => {
  it('combines the styling and the breakpoint visibility of a block', () => {
    expect(
      puckBlockCss(
        theme,
        {
          styling: { margin: { top: 1, left: 2 }, opacity: 50 },
          visibility: { breakpoints: ['sm', 'md', 'lg', 'xl'] },
        },
        { marginSides: ['top', 'bottom'] }
      )
    ).toEqual({
      marginTop: theme.spacing(1),
      opacity: 0.5,
      [theme.breakpoints.only('xs')]: { display: 'none' },
    });
  });

  it('renders nothing for a block without styling and visibility', () => {
    expect(puckBlockCss(theme, {})).toEqual({});
    expect(puckBlockCss(theme, { styling: null, visibility: null })).toEqual(
      {}
    );
  });
});
