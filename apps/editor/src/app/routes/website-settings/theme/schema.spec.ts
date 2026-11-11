import i18n from 'i18next';

import {
  normalizeTheme,
  normalizeValues,
  paletteSchema,
  typographyItem,
  typographySchema,
} from './schema';
import { mediaQuery } from './typography-breakpoints';

const sm = mediaQuery('sm');
const md = mediaQuery('md');
const xl = mediaQuery('xl');

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map(issue => issue.message);

describe('theme schema validation messages', () => {
  beforeAll(async () => {
    await i18n.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            websiteSettings: {
              theme: {
                invalidColor: 'Invalid colour',
                invalidLength: 'Needs a unit',
                lengthOutOfRange: 'Between {{min}} and {{max}}',
              },
            },
          },
        },
        de: {
          translation: {
            websiteSettings: {
              theme: {
                invalidColor: 'Ungültige Farbe',
                invalidLength: 'Braucht eine Einheit',
                lengthOutOfRange: 'Zwischen {{min}} und {{max}}',
              },
            },
          },
        },
      },
    });
  });

  afterEach(() => i18n.changeLanguage('en'));

  const invalidColor = () =>
    paletteSchema.shape.divider.safeParse('not-a-colour');

  it('translates an invalid colour', () => {
    expect(messages(invalidColor())).toEqual(['Invalid colour']);
  });

  it('translates a length without a unit', () => {
    expect(messages(typographyItem.shape.fontSize.safeParse('big'))).toContain(
      'Needs a unit'
    );
  });

  it('names the allowed range of a length that is out of range', () => {
    expect(messages(typographyItem.shape.fontSize.safeParse('100em'))).toEqual([
      'Between 0.5em and 6.5em',
    ]);
  });

  it('allows the same line height range on the base as on every style', () => {
    const base = typographySchema.shape.allVariants.shape.lineHeight;

    expect(messages(base.safeParse('0.5em'))).toEqual(['Between 1em and 3em']);
    expect(base.safeParse('3em').success).toBe(true);
    expect(messages(base.safeParse('4em'))).toEqual(
      messages(typographyItem.shape.lineHeight.safeParse('4em'))
    );
  });

  it('follows the language at validation time, not at import time', async () => {
    await i18n.changeLanguage('de');

    expect(messages(invalidColor())).toEqual(['Ungültige Farbe']);
    expect(messages(typographyItem.shape.fontSize.safeParse('100em'))).toEqual([
      'Zwischen 0.5em und 6.5em',
    ]);
  });
});

describe('normalizeValues colours', () => {
  it('keeps an opaque rgb() colour opaque', () => {
    expect(normalizeValues('rgb(237, 75, 130)', 'color')).toBe('#ED4B82');
  });

  it('converts alpha to the 0-255 hex range', () => {
    expect(normalizeValues('rgba(0, 0, 0, 0.5)', 'color')).toBe('#00000080');
  });

  it('leaves hex colours untouched', () => {
    expect(normalizeValues('#0288d1', 'color')).toBe('#0288d1');
  });
});

describe('typography breakpoints', () => {
  it('parses sparse media query overrides', () => {
    const result = typographyItem.safeParse({
      fontSize: '2rem',
      [xl]: { lineHeight: '1.2em' },
      [md]: { fontSize: '3rem' },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      fontSize: '2rem',
      [md]: { fontSize: '3rem' },
      [xl]: { lineHeight: '1.2em' },
    });
    expect(Object.keys(result.data ?? {})).toEqual(['fontSize', md, xl]);
  });

  it('has no breakpoints object and strips unknown media queries', () => {
    const result = typographyItem.safeParse({
      breakpoints: { md: { fontSize: '3rem' } },
      '@media (min-width:1234px)': { fontSize: '3rem' },
    });

    expect(result.data).toEqual({});
  });

  it('rejects an override outside the allowed range', () => {
    expect(
      typographyItem.safeParse({ [md]: { fontSize: '100em' } }).success
    ).toBe(false);
  });

  it('only keeps size, line height and letter spacing per breakpoint', () => {
    const result = typographyItem.safeParse({
      [sm]: { fontFamily: 'Lora', letterSpacing: '0.01em' },
    });

    expect(result.data).toEqual({
      [sm]: { letterSpacing: '0.01em' },
    });
  });

  it('keeps the media queries when normalizing', () => {
    expect(
      normalizeTheme({
        typography: {
          h1: { fontSize: 32, [md]: { fontSize: 48 } },
        },
      })
    ).toEqual({
      typography: {
        h1: { fontSize: '32px', [md]: { fontSize: '48px' } },
      },
    });
  });
});
