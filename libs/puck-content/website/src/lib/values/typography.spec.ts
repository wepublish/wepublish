import { createTheme } from '@mui/material';

import {
  getThemeTypographyVariants,
  resolveFontFamily,
  resolveTypography,
} from './typography';

const theme = createTheme();

describe('getThemeTypographyVariants', () => {
  it('lists the variants of the theme without its plain settings', () => {
    const variants = getThemeTypographyVariants(theme);

    expect(variants).toEqual(expect.arrayContaining(['h1', 'body1']));
    expect(variants).not.toContain('allVariants');
    expect(variants).not.toContain('fontFamily');
  });
});

describe('resolveTypography', () => {
  it('returns the styles of a theme variant', () => {
    expect(resolveTypography(theme, { variant: 'h2' })).toBe(
      theme.typography.h2
    );
    expect(resolveTypography(theme, undefined)).toBeUndefined();
  });

  it('builds custom font settings', () => {
    expect(
      resolveTypography(theme, {
        variant: 'custom',
        fontSize: '1.25rem',
        lineHeight: '1.4',
        fontFamily: 'Inter',
        fontWeight: 700,
      })
    ).toEqual({
      fontSize: '1.25rem',
      lineHeight: 1.4,
      fontFamily: resolveFontFamily(theme, 'Inter'),
      fontWeight: 700,
    });
  });
});

describe('resolveFontFamily', () => {
  it('falls back to the theme font', () => {
    expect(resolveFontFamily(theme, 'Inter')).toBe(
      `"Inter", ${theme.typography.fontFamily}`
    );
    expect(resolveFontFamily(theme)).toBe(theme.typography.fontFamily);
  });
});
