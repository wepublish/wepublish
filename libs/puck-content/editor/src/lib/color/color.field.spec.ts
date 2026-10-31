import { createTheme } from '@mui/material';

import {
  filterThemeColorGroups,
  findThemeColor,
  formatColorHex,
  getThemeColorGroups,
  getThemeColors,
  humanizeColorKey,
  isHexColor,
  isLightColor,
  isThemeColor,
  parseHexInput,
  resolveColor,
  resolvePaletteColor,
  toHexColor,
  toRgba,
} from './color.field';

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

describe('theme colour groups', () => {
  it('derives every palette entry with a main colour, tenant additions included', () => {
    const groups = getThemeColorGroups(theme.palette);

    expect(groups.map(({ group }) => group)).toEqual([
      'primary',
      'secondary',
      'accent',
      'success',
      'error',
      'info',
      'warning',
      'tertiary',
      'text',
      'background',
      'common',
    ]);
  });

  it('only lists the shades a palette entry defines', () => {
    const groups = getThemeColorGroups(theme.palette);

    expect(groups.find(({ group }) => group === 'primary')?.shades).toEqual([
      'main',
      'light',
      'dark',
      'contrastText',
    ]);
    expect(groups.find(({ group }) => group === 'tertiary')?.shades).toEqual([
      'main',
    ]);
    expect(groups.find(({ group }) => group === 'text')?.shades).toEqual([
      'primary',
      'secondary',
      'disabled',
    ]);
    expect(groups.find(({ group }) => group === 'background')?.shades).toEqual([
      'default',
      'paper',
    ]);
    expect(groups.find(({ group }) => group === 'common')?.shades).toEqual([
      'black',
      'white',
    ]);
  });

  it('returns no groups while the website theme has no palette', () => {
    expect(getThemeColorGroups(undefined)).toEqual([]);
  });

  it('flattens groups into colour paths', () => {
    expect(
      getThemeColors([
        { group: 'primary', shades: ['main', 'light'] },
        { group: 'tertiary', shades: ['main'] },
      ])
    ).toEqual(['primary.main', 'primary.light', 'tertiary.main']);
  });

  it('restricts groups to the allowed colours and drops empty groups', () => {
    const groups = [
      { group: 'primary', shades: ['main', 'light'] },
      { group: 'tertiary', shades: ['main'] },
    ];

    expect(filterThemeColorGroups(groups, undefined)).toBe(groups);
    expect(filterThemeColorGroups(groups, ['primary.light'])).toEqual([
      { group: 'primary', shades: ['light'] },
    ]);
  });
});

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

  it('parses hex input with or without the hash', () => {
    expect(parseHexInput(' 1A1A1A ')).toBe('#1a1a1a');
    expect(parseHexInput('#0F0')).toBe('#0f0');
    expect(parseHexInput('zzz')).toBeUndefined();
    expect(parseHexInput('')).toBeUndefined();
  });

  it('converts colours to rgba', () => {
    expect(toRgba('#1a1a1a')).toEqual({ r: 26, g: 26, b: 26, a: 1 });
    expect(toRgba('#0f08')).toEqual({ r: 0, g: 255, b: 0, a: 0.533 });
    expect(toRgba('rgba(0, 0, 0, 0.87)')).toEqual({
      r: 0,
      g: 0,
      b: 0,
      a: 0.87,
    });
    expect(toRgba('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(toRgba('red')).toBeUndefined();
    expect(toRgba('#zzz')).toBeUndefined();
  });

  it('converts rgba to hex, adding alpha only when transparent', () => {
    expect(toHexColor({ r: 26, g: 26, b: 26, a: 1 })).toBe('#1a1a1a');
    expect(toHexColor({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('#ff000080');
    expect(toHexColor({ r: 254.6, g: 0.2, b: 0, a: 1 })).toBe('#ff0000');
  });

  it('formats colours as upper case hex for display', () => {
    expect(formatColorHex('#e91e63')).toBe('#E91E63');
    expect(formatColorHex('rgba(0, 0, 0, 0.87)')).toBe('#000000DE');
    expect(formatColorHex('var(--x)')).toBe('var(--x)');
    expect(formatColorHex(undefined)).toBeUndefined();
  });
});

describe('findThemeColor', () => {
  it('finds the theme colour matching a custom colour', () => {
    expect(findThemeColor(theme, '#E91E63')).toBe('primary.main');
    expect(findThemeColor(theme, '#e91e63ff')).toBe('primary.main');
    expect(findThemeColor(theme, '#123456')).toBe('tertiary.main');
    expect(findThemeColor(theme, '#000000de')).toBe('text.primary');
  });

  it('prefers palette groups over the fixed text and common groups', () => {
    expect(findThemeColor(theme, '#000')).toBe('secondary.main');
  });

  it('ignores colours that differ or are not allowed', () => {
    expect(findThemeColor(theme, '#e91e6380')).toBeUndefined();
    expect(findThemeColor(theme, '#010203')).toBeUndefined();
    expect(findThemeColor(theme, 'nope')).toBeUndefined();
    expect(
      findThemeColor(theme, '#e91e63', ['secondary.main'])
    ).toBeUndefined();
  });
});

describe('colour helpers', () => {
  it('tells light from dark colours', () => {
    expect(isLightColor('#ffffff')).toBe(true);
    expect(isLightColor('#f5ff64')).toBe(true);
    expect(isLightColor('#000000')).toBe(false);
    expect(isLightColor('#e91e63')).toBe(false);
    expect(isLightColor('var(--x)')).toBeUndefined();
  });

  it('turns palette keys into readable names', () => {
    expect(humanizeColorKey('tertiary')).toBe('Tertiary');
    expect(humanizeColorKey('brandBlue')).toBe('Brand blue');
    expect(humanizeColorKey('contrastText')).toBe('Contrast text');
  });
});
