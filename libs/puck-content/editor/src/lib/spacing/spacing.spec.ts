import { fromSpacingParts, spacingSchema, toSpacingParts } from './spacing';

describe('spacing values', () => {
  it('splits a value into its amount and unit', () => {
    expect(toSpacingParts(2)).toEqual({ amount: 2, unit: 'spacing' });
    expect(toSpacingParts('12px')).toEqual({ amount: 12, unit: 'px' });
    expect(toSpacingParts(undefined)).toEqual({
      amount: undefined,
      unit: 'spacing',
    });
  });

  it('builds a value from an amount and unit', () => {
    expect(fromSpacingParts(2, 'spacing')).toBe(2);
    expect(fromSpacingParts(12, 'px')).toBe('12px');
    expect(fromSpacingParts(undefined, 'px')).toBeUndefined();
  });

  it('accepts spacing units and css lengths only', () => {
    expect(spacingSchema.safeParse(1.5).success).toBe(true);
    expect(spacingSchema.safeParse('12px').success).toBe(true);
    expect(spacingSchema.safeParse('12rem').success).toBe(true);
    expect(spacingSchema.safeParse('50lvh').success).toBe(true);
    expect(spacingSchema.safeParse('12foo').success).toBe(false);
    expect(spacingSchema.safeParse(-1).success).toBe(false);
  });
});
