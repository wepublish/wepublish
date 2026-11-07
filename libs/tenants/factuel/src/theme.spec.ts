import { createTheme, ThemeOptions } from '@mui/material/styles';
import { flimmerTenant } from '@wepublish/tenant/flimmer';
import { baseTheme, minimalTheme, theme as sharedTheme } from '@wepublish/ui';

import { CourantColorOverrides, CourantPaletteColors } from './brand-colors';
import websiteSettings from './fixtures/website-settings.json';
import { createCourantTheme } from './theme';

const cmsTheme = (palette: CourantPaletteColors): ThemeOptions =>
  ({ palette }) as unknown as ThemeOptions;

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

describe('Courant theme ownership', () => {
  it('leaves shared themes and another tenant theme unchanged', () => {
    const sharedBefore = JSON.stringify({
      baseTheme,
      minimalTheme,
      sharedTheme,
    });
    const siblingBefore = JSON.stringify(flimmerTenant.createTheme());

    createCourantTheme(websiteSettings.theme as unknown as ThemeOptions);
    createCourantTheme(undefined, {
      palette: { primary: { main: '#123456' } },
    });

    expect(JSON.stringify({ baseTheme, minimalTheme, sharedTheme })).toBe(
      sharedBefore
    );
    expect(JSON.stringify(flimmerTenant.createTheme())).toBe(siblingBefore);
  });

  it('ignores CMS typography, responsive rules, layout, and component overrides', () => {
    const baseline = createCourantTheme();
    const theme = createCourantTheme({
      typography: {
        fontFamily: 'CMS Font',
        fontSize: 30,
        allVariants: { fontFamily: 'CMS Font', fontWeight: 900, lineHeight: 3 },
        h1: {
          fontSize: '99px',
          fontWeight: 900,
          margin: '99px',
          padding: '99px',
          '@media (min-width:900px)': {
            fontSize: '100px',
            fontFamily: 'Responsive CMS Font',
          },
        },
      },
      spacing: 99,
      breakpoints: { values: { xs: 0, sm: 1, md: 2, lg: 3, xl: 4 } },
      shape: { borderRadius: 99 },
      components: {
        MuiButton: { styleOverrides: { root: { padding: '99px' } } },
      },
      palette: {
        mode: 'dark',
        tonalOffset: 0.9,
        contrastThreshold: 20,
        action: { hoverOpacity: 0.9 },
      },
    } as unknown as ThemeOptions);

    // pxToRem is a new function per theme; compare its result separately.
    const { pxToRem: actualPxToRem, ...actualTypography } = theme.typography;
    const { pxToRem: baselinePxToRem, ...baselineTypography } =
      baseline.typography;
    expect(actualTypography).toEqual(baselineTypography);
    expect(actualPxToRem(24)).toBe(baselinePxToRem(24));
    expect(theme.spacing(2)).toBe('8px');
    expect(theme.breakpoints.values).toEqual(baseline.breakpoints.values);
    expect(theme.breakpoints.values.lg).toBe(1333);
    expect(theme.shape).toEqual(baseline.shape);
    expect(typeof theme.components?.MuiButton?.styleOverrides?.root).toBe(
      'function'
    );
    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.tonalOffset).toBe(baseline.palette.tonalOffset);
    expect(theme.palette.contrastThreshold).toBe(
      baseline.palette.contrastThreshold
    );
    expect(theme.palette.action.hoverOpacity).toBe(
      baseline.palette.action.hoverOpacity
    );
  });

  it('maps teaserLead to the editorial serif role', () => {
    const theme = createCourantTheme();
    expect(theme.typography.teaserLead.fontFamily).toBe(
      'var(--courant-editorial)'
    );
    expect(theme.typography.teaserLead.fontWeight).toBe(
      'var(--courant-editorial-weight)'
    );
  });

  it('keeps the title block lead (subtitle1) on the sans body role', () => {
    const theme = createCourantTheme();
    expect(theme.typography.subtitle1.fontFamily).toBe('var(--courant-sans)');
  });

  it('preserves the complete CMS fixture palette when brand colors are unset', () => {
    const theme = createCourantTheme(
      websiteSettings.theme as unknown as ThemeOptions,
      {}
    );
    expect(theme.palette).toMatchObject(websiteSettings.theme.palette);
  });

  it('uses the tenant palette fallbacks without settings', () => {
    const { palette } = createCourantTheme(undefined, {});
    expect(palette.primary.main).toBe('#FDEB0B');
    expect(palette.secondary.main).toBe('#000');
    expect(palette.accent).toMatchObject({ main: '#000000', light: '#666666' });
    expect(palette.grey[800]).toBe('#1a1a1a');
  });
});

describe('Courant color resolution', () => {
  it('resolves each palette field independently with brand above CMS', () => {
    const theme = createCourantTheme(
      websiteSettings.theme as unknown as ThemeOptions,
      {
        palette: {
          primary: { main: '#123456', contrastText: '#ffffff' },
          accent: { dark: '#112233' },
          background: { default: '#eeeeee' },
          common: { white: '#fefefe' },
          grey: { 800: '#222222' },
          text: { secondary: '#333333' },
          divider: '#444444',
        },
      }
    );
    expect(theme.palette.primary).toEqual({
      main: '#123456',
      contrastText: '#ffffff',
      light: websiteSettings.theme.palette.primary.light,
      dark: websiteSettings.theme.palette.primary.dark,
    });
    expect(theme.palette.accent).toMatchObject({
      main: '#F5FF64',
      dark: '#112233',
    });
    expect(theme.palette.background).toEqual({
      default: '#eeeeee',
      paper: '#fdeb0b',
    });
    expect(theme.palette.common.white).toBe('#fefefe');
    expect(theme.palette.grey[800]).toBe('#222222');
    expect(theme.palette.text).toMatchObject({
      primary: '#000000ff',
      secondary: '#333333',
    });
    expect(theme.palette.divider).toBe('#444444');
  });

  it.each(['primary', 'secondary', 'accent'] as const)(
    'derives %s shades from the resolved main',
    family => {
      const expected = createTheme().palette.augmentColor({
        color: { main: '#123456' },
      });
      const fromCms = createCourantTheme(
        cmsTheme({ [family]: { main: '#123456' } }),
        {}
      );
      const fromBrand = createCourantTheme(
        cmsTheme({ [family]: { main: '#abcdef' } }),
        {
          palette: { [family]: { main: '#123456' } },
        }
      );
      expect(fromCms.palette[family]).toEqual(expected);
      expect(fromBrand.palette[family]).toEqual(expected);
    }
  );

  it.each([
    'primary',
    'secondary',
    'accent',
    'info',
    'success',
    'warning',
    'error',
  ] as const)('supports partial %s groups without main', family => {
    const theme = createCourantTheme(
      cmsTheme({ [family]: { light: '#abcdef' } }),
      {
        palette: { [family]: { dark: '#123456' } },
      }
    );
    expect(theme.palette[family]).toMatchObject({
      light: '#abcdef',
      dark: '#123456',
    });
    expect(theme.palette[family].main).toBe(
      createCourantTheme(undefined, {}).palette[family].main
    );
  });

  it.each([undefined, null, '', '   '])(
    'treats %j as unset without hiding CMS fallback',
    value => {
      const theme = createCourantTheme(
        cmsTheme({ primary: { main: '#123456' }, divider: '#abcdef' }),
        {
          palette: { primary: { main: value, light: value }, divider: value },
          typography: { heading: { color: value } },
        }
      );
      expect(theme.palette.primary.main).toBe('#123456');
      expect(theme.palette.primary.light).toBe(
        createTheme().palette.augmentColor({ color: { main: '#123456' } }).light
      );
      expect(theme.palette.divider).toBe('#abcdef');
      expect(theme.typography.h1.color).toBeUndefined();
      expect(
        createCourantTheme(cmsTheme({ primary: { main: value } }), {}).palette
          .primary.main
      ).toBe('#FDEB0B');
    }
  );

  it('preserves transparent colors in palette and role overrides', () => {
    const theme = createCourantTheme(
      cmsTheme({
        background: { default: '#00000000' },
        divider: 'transparent',
      }),
      {
        palette: {
          primary: { main: 'rgba(0, 0, 0, 0)' },
          background: { paper: 'transparent' },
        },
        typography: { caption: { color: '#00000000' } },
      }
    );
    expect(theme.palette.primary.main).toBe('rgba(0, 0, 0, 0)');
    expect(theme.palette.background).toEqual({
      default: '#00000000',
      paper: 'transparent',
    });
    expect(theme.palette.divider).toBe('transparent');
    expect(theme.typography.caption.color).toBe('#00000000');
  });

  it('applies role and teaser label colors without leaking body colors into headings', () => {
    const theme = createCourantTheme(undefined, {
      typography: {
        body: { color: '#111111', backgroundColor: '#eeeeee' },
        heading: { color: '#222222' },
        kicker: { color: '#333333' },
      },
      teaserLabel: { color: '#ffffff', backgroundColor: '#123456' },
    });
    expect(theme.typography.body1).toMatchObject({
      color: '#111111',
      backgroundColor: '#eeeeee',
    });
    expect(theme.typography.h1.color).toBe('#222222');
    expect(theme.typography.h1.backgroundColor).toBeUndefined();
    expect(theme.typography.blockTitlePreTitle.color).toBe('#333333');
    expect(theme.typography.teaserPretitle).toMatchObject({
      color: '#ffffff',
      backgroundColor: '#123456',
    });
  });

  it('does not mutate CMS settings or color overrides across repeated calls', () => {
    const settings = deepFreeze(
      structuredClone(websiteSettings.theme)
    ) as unknown as ThemeOptions;
    const overrides: CourantColorOverrides = deepFreeze({
      palette: { accent: { main: '#123456', light: null } },
    });
    const before = JSON.stringify({ settings, overrides });
    expect(createCourantTheme(settings, overrides).palette.accent.main).toBe(
      '#123456'
    );
    expect(createCourantTheme(settings, {}).palette.accent.main).toBe(
      '#F5FF64'
    );
    expect(JSON.stringify({ settings, overrides })).toBe(before);
  });
});
