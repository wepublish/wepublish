import { FontStyle, FontWeight } from '@wepublish/editor/api';

import {
  createThemeExport,
  mergeFonts,
  parseThemeImport,
  THEME_EXPORT_VERSION,
} from './theme-transfer';
import { mediaQuery } from './typography-breakpoints';

const sm = mediaQuery('sm');
const md = mediaQuery('md');
const lg = mediaQuery('lg');

const roboto = {
  name: 'Roboto',
  weight: [FontWeight.Regular, FontWeight.Bold],
  style: [FontStyle.Normal],
};
const lora = {
  name: 'Lora',
  weight: [FontWeight.Regular],
  style: [FontStyle.Italic],
};
const unused = {
  name: 'Unused Sans',
  weight: [FontWeight.Light],
  style: [FontStyle.Normal],
};

const theme = {
  palette: {
    primary: { main: '#e91e63' },
  },
  typography: {
    allVariants: {
      fontFamily: '"Roboto", Helvetica, Arial, sans-serif',
    },
    h1: { fontFamily: '"Lora", Helvetica, Arial, sans-serif', fontWeight: 600 },
  },
};

describe('createThemeExport', () => {
  it('wraps palette and typography with a version', () => {
    const result = createThemeExport(theme as never, []);

    expect(result.version).toBe(THEME_EXPORT_VERSION);
    expect(result.theme).toEqual({
      palette: theme.palette,
      typography: theme.typography,
    });
  });

  it('includes only the fonts the theme refers to', () => {
    const result = createThemeExport(theme as never, [roboto, unused, lora]);

    expect(result.fonts).toEqual([roboto, lora]);
  });

  it('leaves out MUI internals that are not part of the stored theme', () => {
    const result = createThemeExport(
      { ...theme, breakpoints: { values: {} }, zIndex: {} } as never,
      []
    );

    expect(Object.keys(result.theme)).toEqual(['palette', 'typography']);
  });
});

describe('parseThemeImport', () => {
  it('reads the current export format including fonts', () => {
    const result = parseThemeImport({
      version: THEME_EXPORT_VERSION,
      theme,
      fonts: [roboto],
    });

    expect(result.theme.palette.primary.main).toBe('#e91e63');
    expect(result.theme.typography.h1.fontWeight).toBe(600);
    expect(result.fonts).toEqual([roboto]);
  });

  it('reads a legacy export (the whole MUI theme) without fonts', () => {
    const result = parseThemeImport({
      ...theme,
      breakpoints: { keys: { 0: 'xs' }, values: { xs: '0px' } },
      internal_cache: {},
      typography: {
        ...theme.typography,
        htmlFontSize: 16,
        button: { textTransform: 'uppercase' },
      },
    });

    expect(result.theme.palette.primary.main).toBe('#e91e63');
    expect(result.theme.typography).not.toHaveProperty('button');
    expect(result.fonts).toEqual([]);
  });

  it('keeps the media queries through an export and import', () => {
    const responsive = {
      ...theme,
      typography: {
        ...theme.typography,
        h1: {
          ...theme.typography.h1,
          fontSize: '2rem',
          [md]: { fontSize: '3rem' },
          [lg]: { lineHeight: '1.1em' },
        },
      },
    };

    const result = parseThemeImport(
      JSON.parse(JSON.stringify(createThemeExport(responsive as never, [])))
    );

    expect(result.theme.typography.h1).toMatchObject({
      fontSize: '2rem',
      [md]: { fontSize: '3rem' },
      [lg]: { lineHeight: '1.1em' },
    });
    expect(result.theme.typography.h1).not.toHaveProperty('breakpoints');
    expect(
      Object.keys(result.theme.typography.h1).filter(key =>
        key.startsWith('@media')
      )
    ).toEqual([md, lg]);
  });

  it('exports the media queries of the form unchanged', () => {
    const h1 = {
      ...theme.typography.h1,
      [md]: { fontSize: '3rem', lineHeight: null },
      [lg]: {},
    };
    const result = createThemeExport(
      { ...theme, typography: { ...theme.typography, h1 } } as never,
      []
    );

    expect(result.theme.typography.h1).toEqual(h1);
  });

  it('imports the media queries of the theme unchanged', () => {
    const result = parseThemeImport({
      version: THEME_EXPORT_VERSION,
      theme: {
        ...theme,
        typography: {
          ...theme.typography,
          h1: {
            ...theme.typography.h1,
            fontSize: '2rem',
            [sm]: { fontSize: '2.5rem' },
          },
        },
      },
    });

    expect(result.theme.typography.h1[sm]).toEqual({ fontSize: '2.5rem' });
    expect(result.theme.typography.h1).not.toHaveProperty('breakpoints');
  });

  it('fills values the file leaves out from the default theme', () => {
    const result = parseThemeImport({ version: 1, theme: { palette: {} } });

    expect(result.theme.palette.primary.main).toMatch(/^#/);
    expect(result.theme.typography.h1).toBeDefined();
  });

  it('rejects JSON that is not a theme', () => {
    expect(() => parseThemeImport({ foo: 'bar' })).toThrow();
    expect(() => parseThemeImport(null)).toThrow();
    expect(() => parseThemeImport([1, 2])).toThrow();
  });

  it('rejects invalid values', () => {
    expect(() =>
      parseThemeImport({ theme: { palette: { primary: { main: 'red' } } } })
    ).toThrow();
  });

  it('rejects malformed fonts', () => {
    expect(() =>
      parseThemeImport({
        theme,
        fonts: [{ name: 'Roboto', weight: ['Heavy'], style: [] }],
      })
    ).toThrow();
  });
});

describe('mergeFonts', () => {
  it('appends fonts that are missing', () => {
    expect(mergeFonts([roboto], [lora])).toEqual([roboto, lora]);
  });

  it('adds missing weights and styles to a font that exists', () => {
    const existing = {
      name: 'Roboto',
      weight: [FontWeight.Regular],
      style: [FontStyle.Normal],
    };

    expect(
      mergeFonts(
        [existing],
        [
          {
            name: 'Roboto',
            weight: [FontWeight.Bold],
            style: [FontStyle.Italic],
          },
        ]
      )
    ).toEqual([
      {
        name: 'Roboto',
        weight: [FontWeight.Regular, FontWeight.Bold],
        style: [FontStyle.Normal, FontStyle.Italic],
      },
    ]);
  });

  it('returns undefined when nothing changes, so Save leaves fonts alone', () => {
    expect(mergeFonts([roboto], [])).toBeUndefined();
    expect(mergeFonts([roboto], [roboto])).toBeUndefined();
  });
});
