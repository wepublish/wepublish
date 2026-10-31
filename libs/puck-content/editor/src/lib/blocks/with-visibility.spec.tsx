import { createTheme } from '@mui/material';

import { isBlockRendered, visibilityStyles } from './with-visibility';

const theme = createTheme();

describe('isBlockRendered', () => {
  it('drops disabled blocks from the website but keeps them in the editor', () => {
    expect(isBlockRendered({ disabled: true }, false)).toBe(false);
    expect(isBlockRendered({ disabled: true }, true)).toBe(true);
    expect(isBlockRendered(undefined, false)).toBe(true);
  });
});

describe('visibilityStyles', () => {
  it('hides the block on the breakpoints it is not shown on', () => {
    expect(
      visibilityStyles({ breakpoints: ['md', 'lg', 'xl'] })(theme)
    ).toEqual({
      [theme.breakpoints.only('xs')]: { display: 'none' },
      [theme.breakpoints.only('sm')]: { display: 'none' },
    });
  });

  it('dims a disabled block in the editor', () => {
    expect(visibilityStyles({ disabled: true }, true)(theme)).toEqual({
      opacity: 0.4,
    });
  });
});
