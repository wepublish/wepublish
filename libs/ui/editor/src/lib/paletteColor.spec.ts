import { createTheme } from '@mui/material';

import { paletteColor } from './paletteColor';

const theme = createTheme({ cssVariables: true });

describe('paletteColor', () => {
  it('reads a colour off the palette', () => {
    expect(paletteColor(theme, 'success.main')).toBe(
      theme.vars.palette.success.main
    );
  });

  it('reaches nested entries', () => {
    expect(paletteColor(theme, 'grey.400')).toBe(theme.vars.palette.grey[400]);
  });

  it('hands back anything that is not a palette path', () => {
    expect(paletteColor(theme, '#c4302b')).toBe('#c4302b');
    expect(paletteColor(theme, 'currentColor')).toBe('currentColor');
  });

  it('hands back a path that leads nowhere', () => {
    expect(paletteColor(theme, 'success.nonesuch')).toBe('success.nonesuch');
  });
});
