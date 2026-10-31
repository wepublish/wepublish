import { createTheme } from '@mui/material';

import { spacingToCss } from './spacing';

const theme = createTheme();

describe('spacing values', () => {
  it('renders spacing units through the theme and pixels as they are', () => {
    expect(spacingToCss(theme, 2)).toBe(theme.spacing(2));
    expect(spacingToCss(theme, '12px')).toBe('12px');
    expect(spacingToCss(theme, undefined)).toBeUndefined();
  });
});
