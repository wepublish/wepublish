import {
  PuckBlockStylingLike,
  PuckBreakpointStyling,
} from '@wepublish/puck-content/website';
import { z } from 'zod/v4';

import {
  backgroundPositionValues,
  BreakpointStylingValue,
  fromLengthParts,
  hasStylingValue,
  headingLevel,
  humanizeTypographyVariant,
  isStylingGroupModified,
  resetStylingGroup,
  setBreakpointStyling,
  setStyling,
  stylingGroupKeys,
  stylingGroups,
  stylingFieldAi,
  stylingSchema,
  StylingValue,
  toBreakpointStyling,
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

  it('stores what the website turns into CSS', () => {
    expectTypeOf<StylingValue>().toExtend<PuckBlockStylingLike>();
    expectTypeOf<BreakpointStylingValue>().toExtend<PuckBreakpointStyling>();
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

  it('resets the corner shape with the border', () => {
    expect(
      resetStylingGroup(
        {
          border: { width: { top: 1 } },
          borderRadius: { topLeft: 2 },
          cornerShape: 'squircle',
          opacity: 50,
        },
        'border'
      )
    ).toEqual({ opacity: 50 });
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
  it('builds a length from amount and unit', () => {
    expect(fromLengthParts(80, '%')).toBe('80%');
    expect(fromLengthParts(undefined, 'px')).toBeUndefined();
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
        cornerShape: 'squircle',
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
    expect(schema.safeParse({ cornerShape: 'superellipse(2)' }).success).toBe(
      false
    );
  });

  it('tells the AI about the corner shape', () => {
    expect(stylingFieldAi().instructions).toContain('corner shape');
    expect(JSON.stringify(stylingFieldAi().schema)).toContain('squircle');
  });

  it('asks the AI for the styling per breakpoint, mobile first', () => {
    const { instructions, schema } = stylingFieldAi(undefined, ['spacing']);
    const properties = (
      schema as {
        properties: Record<string, { properties: Record<string, unknown> }>;
      }
    ).properties;

    expect(Object.keys(properties)).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
    expect(Object.keys(properties.md.properties)).toEqual([
      'margin',
      'padding',
    ]);
    expect(instructions).toContain('breakpoint');
  });

  it('offers a 3 by 3 grid of background positions', () => {
    expect(backgroundPositionValues).toHaveLength(9);
    expect(new Set(backgroundPositionValues).size).toBe(9);
  });
});

describe('setBreakpointStyling', () => {
  it('sets the styling of one breakpoint and keeps the others', () => {
    expect(
      setBreakpointStyling(
        { xs: { color: 'primary.main' }, md: { opacity: 50 } },
        'md',
        { opacity: 80 }
      )
    ).toEqual({ xs: { color: 'primary.main' }, md: { opacity: 80 } });
  });

  it('keeps a larger breakpoint without values so its tab stays', () => {
    expect(
      setBreakpointStyling(
        { xs: { color: 'primary.main' }, md: { opacity: 50 } },
        'md',
        undefined
      )
    ).toEqual({ xs: { color: 'primary.main' }, md: {} });
  });

  it('returns nothing once the smallest breakpoint is all that is left and empty', () => {
    expect(
      setBreakpointStyling({ xs: { opacity: 50 } }, 'xs', undefined)
    ).toBeUndefined();
    expect(setBreakpointStyling(undefined, 'xs', undefined)).toBeUndefined();
    expect(setBreakpointStyling(undefined, 'xs', { opacity: 50 })).toEqual({
      xs: { opacity: 50 },
    });
  });
});

describe('toBreakpointStyling', () => {
  it('reads a styling saved before the breakpoints as the smallest breakpoint', () => {
    expect(toBreakpointStyling({ color: 'primary.main' })).toEqual({
      xs: { color: 'primary.main' },
    });
  });

  it('keeps a styling split by breakpoint', () => {
    const value = { xs: { color: 'primary.main' }, md: { opacity: 50 } };

    expect(toBreakpointStyling(value)).toBe(value);
    expect(toBreakpointStyling({})).toEqual({});
    expect(toBreakpointStyling(undefined)).toBeUndefined();
  });
});
