import { z } from 'zod/v4';
import { SpacingValue } from '@wepublish/puck-content/website';

export { spacingToCss } from '@wepublish/puck-content/website';
export type { PixelValue, SpacingValue } from '@wepublish/puck-content/website';

export type SpacingUnit = 'spacing' | 'px';
export const spacingUnits: SpacingUnit[] = ['spacing', 'px'];

export const toSpacingParts = (
  value: SpacingValue | undefined
): { amount: number | undefined; unit: SpacingUnit } => {
  if (typeof value === 'string') {
    return { amount: parseFloat(value), unit: 'px' };
  }

  return { amount: value, unit: 'spacing' };
};

export const fromSpacingParts = (
  amount: number | undefined,
  unit: SpacingUnit
): SpacingValue | undefined => {
  if (amount === undefined) {
    return undefined;
  }

  return unit === 'px' ? `${amount}px` : amount;
};

export const spacingSchema = z
  .union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?px$/)])
  .describe(
    'A number of theme spacing units (usually 8px each), or an exact pixel value as a string like "12px"'
  );
