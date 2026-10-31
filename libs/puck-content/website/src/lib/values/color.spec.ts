import { createTheme } from '@mui/material';

import {
  isHexColor,
  isThemeColor,
  resolveColor,
  resolvePaletteColor,
} from './color';

const websitePalette = {
  primary: { main: '#e91e63' },
  secondary: { main: '#000000' },
  accent: { main: '#f5ff64', light: '#a4efef' },
};

const tenantAdditions = { palette: { tertiary: { main: '#123456' } } };

const theme = createTheme({ palette: websitePalette }, tenantAdditions);
const cssVarsTheme = createTheme(
  { cssVariables: true, palette: websitePalette },
  tenantAdditions
);

describe('isThemeColor', () => {
  it('recognises palette paths, including tenant groups', () => {
    expect(isThemeColor('primary.main')).toBe(true);
    expect(isThemeColor('tertiary.main')).toBe(true);
    expect(isThemeColor('#fff')).toBe(false);
    expect(isThemeColor('rgba(0, 0, 0, 0.5)')).toBe(false);
    expect(isThemeColor(undefined)).toBe(false);
  });

  it('checks membership when a list of colours is given', () => {
    expect(isThemeColor('primary.main', ['primary.main'])).toBe(true);
    expect(isThemeColor('tertiary.main', ['primary.main'])).toBe(false);
  });
});

describe('resolveColor', () => {
  it('keeps unset and custom colours as they are', () => {
    expect(resolveColor(theme, undefined)).toBeUndefined();
    expect(resolveColor(theme, '')).toBeUndefined();
    expect(resolveColor(theme, '#1a1a1a')).toBe('#1a1a1a');
  });

  it('looks theme colours up in the palette', () => {
    expect(resolveColor(theme, 'primary.main')).toBe('#e91e63');
    expect(resolveColor(theme, 'tertiary.main')).toBe('#123456');
    expect(resolveColor(theme, 'text.primary')).toBe(
      theme.palette.text.primary
    );
    expect(resolveColor(theme, 'tertiary.dark')).toBeUndefined();
  });

  it('prefers the CSS variables of a theme that has them', () => {
    expect(resolveColor(cssVarsTheme, 'primary.main')).toBe(
      'var(--mui-palette-primary-main, #e91e63)'
    );
    expect(resolvePaletteColor(cssVarsTheme, 'primary.main')).toBe('#e91e63');
  });

  it('resolves raw palette values for previews', () => {
    expect(resolvePaletteColor(theme, 'accent.light')).toBe('#a4efef');
    expect(resolvePaletteColor(theme, '#abc')).toBe('#abc');
    expect(resolvePaletteColor(theme, undefined)).toBeUndefined();
  });
});

describe('hex colours', () => {
  it('validates hex colours with 3, 4, 6 or 8 digits', () => {
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('#abcd')).toBe(true);
    expect(isHexColor('#1A1A1A')).toBe(true);
    expect(isHexColor('#1a1a1a80')).toBe(true);
    expect(isHexColor('#1a1a1')).toBe(false);
    expect(isHexColor('1a1a1a')).toBe(false);
    expect(isHexColor('primary.main')).toBe(false);
  });
});
