import { createTheme } from '@mui/material';
import { z } from 'zod/v4';

import {
  backgroundPositionValues,
  fromLengthParts,
  hasStylingValue,
  headingLevel,
  humanizeTypographyVariant,
  isLengthValue,
  isStylingGroupModified,
  radiusToCss,
  resetStylingGroup,
  setStyling,
  stylingGroupKeys,
  stylingGroups,
  stylingSchema,
  StylingValue,
  toLengthParts,
} from './styling.field';

describe('styling groups', () => {
  it('assigns every styling key to exactly one group', () => {
    const grouped = stylingGroups.flatMap(group => stylingGroupKeys[group]);

    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(
      Object.keys(stylingSchema().shape).sort()
    );
  });

  it('keeps the schema in sync with the value type', () => {
    expectTypeOf<
      keyof z.infer<ReturnType<typeof stylingSchema>>
    >().toEqualTypeOf<keyof StylingValue>();
  });

  it('detects whether a group holds any value', () => {
    const value: StylingValue = {
      color: 'primary.main',
      margin: {},
      border: { width: {} },
      shadow: 0,
    };

    expect(isStylingGroupModified(value, 'text')).toBe(true);
    expect(isStylingGroupModified(value, 'spacing')).toBe(false);
    expect(isStylingGroupModified(value, 'border')).toBe(false);
    expect(isStylingGroupModified(value, 'effects')).toBe(true);
    expect(isStylingGroupModified(undefined, 'text')).toBe(false);
  });

  it('resets only the keys of one group', () => {
    expect(
      resetStylingGroup(
        {
          color: 'primary.main',
          textTransform: 'uppercase',
          background: '#ffffff',
          backgroundImage: 'image-1',
        },
        'text'
      )
    ).toEqual({ background: '#ffffff', backgroundImage: 'image-1' });
  });

  it('returns nothing once the last group is reset', () => {
    expect(resetStylingGroup({ opacity: 50 }, 'effects')).toBeUndefined();
    expect(resetStylingGroup(undefined, 'effects')).toBeUndefined();
  });
});

describe('setStyling', () => {
  it('merges a patch into the value', () => {
    expect(
      setStyling({ color: 'primary.main' }, { textTransform: 'uppercase' })
    ).toEqual({ color: 'primary.main', textTransform: 'uppercase' });
  });

  it('drops keys that end up empty', () => {
    expect(
      setStyling(
        { color: 'primary.main', margin: { top: 1 } },
        { color: undefined, margin: {}, padding: { top: undefined } }
      )
    ).toBeUndefined();
  });

  it('keeps zero values', () => {
    expect(setStyling(undefined, { shadow: 0, opacity: 0 })).toEqual({
      shadow: 0,
      opacity: 0,
    });
  });
});

describe('hasStylingValue', () => {
  it('treats empty strings and objects without values as unset', () => {
    expect(hasStylingValue(undefined)).toBe(false);
    expect(hasStylingValue('')).toBe(false);
    expect(hasStylingValue({ top: undefined })).toBe(false);
    expect(hasStylingValue({ width: { top: 0 } })).toBe(true);
    expect(hasStylingValue(0)).toBe(true);
  });
});

describe('length values', () => {
  it('splits a length into amount and unit', () => {
    expect(toLengthParts('320px', ['px', 'vh'])).toEqual({
      amount: 320,
      unit: 'px',
    });
    expect(toLengthParts('50.5vh', ['px', 'vh'])).toEqual({
      amount: 50.5,
      unit: 'vh',
    });
    expect(toLengthParts('50%', ['px', 'vh'])).toBeUndefined();
    expect(toLengthParts(undefined, ['px'])).toBeUndefined();
  });

  it('builds a length from amount and unit', () => {
    expect(fromLengthParts(80, '%')).toBe('80%');
    expect(fromLengthParts(undefined, 'px')).toBeUndefined();
  });

  it('recognises lengths in the allowed units only', () => {
    expect(isLengthValue('100%', ['px', '%'])).toBe(true);
    expect(isLengthValue('100vh', ['px', '%'])).toBe(false);
    expect(isLengthValue('md', ['px', '%'])).toBe(false);
  });
});

describe('typography variant names', () => {
  it('detects heading variants', () => {
    expect(headingLevel('h3')).toBe(3);
    expect(headingLevel('h7')).toBeUndefined();
    expect(headingLevel('body1')).toBeUndefined();
  });

  it('turns variant keys into words', () => {
    expect(humanizeTypographyVariant('subtitle1')).toBe('Subtitle 1');
    expect(humanizeTypographyVariant('teaserPretitle')).toBe('Teaser pretitle');
    expect(humanizeTypographyVariant('caption')).toBe('Caption');
  });
});

describe('radiusToCss', () => {
  it('multiplies numbers with the theme radius and keeps pixels', () => {
    const theme = createTheme({ shape: { borderRadius: 6 } });

    expect(radiusToCss(theme, 2)).toBe('12px');
    expect(radiusToCss(theme, '3px')).toBe('3px');
    expect(radiusToCss(theme, undefined)).toBeUndefined();
  });

  it('scales a radius given as CSS length with calc', () => {
    const theme = createTheme({ shape: { borderRadius: '0.5rem' } });

    expect(radiusToCss(theme, 2)).toBe('calc(0.5rem * 2)');
  });
});

describe('stylingSchema', () => {
  it('accepts the new styling props', () => {
    expect(
      stylingSchema().safeParse({
        typography: 'h2',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        backgroundImage: 'image-1',
        backgroundSize: 'contain',
        backgroundPosition: 'right bottom',
        overlay: '#00000080',
        overlayOpacity: 40,
        borderRadius: { topLeft: 2, bottomRight: '8px' },
        minHeight: '50vh',
        maxWidth: 'md',
        shadow: 4,
        opacity: 80,
      }).success
    ).toBe(true);
  });

  it('rejects values outside their range', () => {
    const schema = stylingSchema();

    expect(schema.safeParse({ shadow: 25 }).success).toBe(false);
    expect(schema.safeParse({ opacity: 101 }).success).toBe(false);
    expect(schema.safeParse({ minHeight: '50%' }).success).toBe(false);
    expect(schema.safeParse({ maxWidth: '10vh' }).success).toBe(false);
    expect(schema.safeParse({ backgroundPosition: 'middle' }).success).toBe(
      false
    );
  });

  it('offers a 3 by 3 grid of background positions', () => {
    expect(backgroundPositionValues).toHaveLength(9);
    expect(new Set(backgroundPositionValues).size).toBe(9);
  });
});
