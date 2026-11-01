import { Theme } from '@emotion/react';

const viewportUnits = ['vw', 'vh', 'vi', 'vb', 'vmin', 'vmax'] as const;

export const cssLengthUnits = [
  'px',
  'cm',
  'mm',
  'q',
  'in',
  'pc',
  'pt',
  'em',
  'rem',
  'ex',
  'rex',
  'cap',
  'rcap',
  'ch',
  'rch',
  'ic',
  'ric',
  'lh',
  'rlh',
  ...viewportUnits,
  ...viewportUnits.map(unit => `s${unit}` as const),
  ...viewportUnits.map(unit => `l${unit}` as const),
  ...viewportUnits.map(unit => `d${unit}` as const),
  'cqw',
  'cqh',
  'cqi',
  'cqb',
  'cqmin',
  'cqmax',
  '%',
] as const;

export type CssLengthUnit = (typeof cssLengthUnits)[number];
export type PixelValue = `${number}px`;
export type CssLengthValue = `${number}${CssLengthUnit}`;
export type SpacingValue = number | CssLengthValue;

export const spacingToCss = (
  theme: Theme,
  value: SpacingValue | null | undefined
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === 'string' ? value : theme.spacing(value);
};
