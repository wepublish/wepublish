import { Theme } from '@emotion/react';

export type PixelValue = `${number}px`;
export type SpacingValue = number | PixelValue;

export const spacingToCss = (
  theme: Theme,
  value: SpacingValue | null | undefined
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === 'string' ? value : theme.spacing(value);
};
