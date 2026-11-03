import { Theme } from '@emotion/react';
import { Breakpoint } from '@mui/material';

import { AlignmentValue } from './alignment';
import { SpacingValue } from './spacing';

export type TextAlignValue = Extract<
  AlignmentValue,
  'left' | 'center' | 'right'
>;

export type FontWeightValue = 'light' | 'regular' | 'medium' | 'bold';

export type TextTransformValue =
  'none' | 'uppercase' | 'lowercase' | 'capitalize';

export type BackgroundSizeValue = 'cover' | 'contain' | 'auto';
export const defaultBackgroundSize: BackgroundSizeValue = 'cover';

export type BackgroundPositionX = 'left' | 'center' | 'right';
export type BackgroundPositionY = 'top' | 'center' | 'bottom';
export type BackgroundPositionValue =
  `${BackgroundPositionX} ${BackgroundPositionY}`;
export const defaultBackgroundPosition: BackgroundPositionValue =
  'center center';
export const defaultOverlayOpacity = 50;

export type Corner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
export const corners: Corner[] = [
  'topLeft',
  'topRight',
  'bottomRight',
  'bottomLeft',
];

export type CornerShapeValue =
  'round' | 'squircle' | 'bevel' | 'scoop' | 'notch' | 'square';
export const cornerShapes: CornerShapeValue[] = [
  'round',
  'squircle',
  'bevel',
  'scoop',
  'notch',
  'square',
];

export type LengthUnit = 'px' | 'vh' | '%';
export type LengthValue<Unit extends LengthUnit = LengthUnit> =
  `${number}${Unit}`;

export type MinHeightUnit = Extract<LengthUnit, 'px' | 'vh'>;
export const minHeightUnits: MinHeightUnit[] = ['px', 'vh'];
export type MinHeightValue = LengthValue<MinHeightUnit>;

export type MaxWidthUnit = Extract<LengthUnit, 'px' | '%'>;
export const maxWidthUnits: MaxWidthUnit[] = ['px', '%'];
export type MaxWidthBreakpoint = Extract<Breakpoint, 'sm' | 'md' | 'lg' | 'xl'>;
export type MaxWidthValue = MaxWidthBreakpoint | LengthValue<MaxWidthUnit>;
export const maxWidthBreakpoints: MaxWidthBreakpoint[] = [
  'sm',
  'md',
  'lg',
  'xl',
];

const lengthPattern = /^(\d+(?:\.\d+)?)(px|vh|%)$/;

export const toLengthParts = <Unit extends LengthUnit>(
  value: string | undefined,
  units: readonly Unit[]
): { amount: number; unit: Unit } | undefined => {
  const match = value?.match(lengthPattern);
  const unit = units.find(allowed => allowed === match?.[2]);

  if (!match || !unit) {
    return undefined;
  }

  return { amount: parseFloat(match[1]), unit };
};

export const isLengthValue = <Unit extends LengthUnit>(
  value: unknown,
  units: readonly Unit[]
): value is LengthValue<Unit> =>
  typeof value === 'string' && !!toLengthParts(value, units);

export const radiusToCss = (
  theme: Theme,
  value: SpacingValue | null | undefined
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  const { borderRadius } = theme.shape;

  return typeof borderRadius === 'number' ?
      `${borderRadius * value}px`
    : `calc(${borderRadius} * ${value})`;
};
