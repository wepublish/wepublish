import { Theme } from '@emotion/react';
import { z } from 'zod/v4';

export type PixelValue = `${number}px`;
export type SpacingValue = number | PixelValue;

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

export const spacingToCss = (
  theme: Theme,
  value: SpacingValue | undefined
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'string' ? value : theme.spacing(value);
};

export const spacingSchema = z
  .union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?px$/)])
  .describe(
    'A number of theme spacing units (usually 8px each), or an exact pixel value as a string like "12px"'
  );
