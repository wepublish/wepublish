import { z } from 'zod/v4';

import { spacingSchema, SpacingValue } from '../spacing/spacing';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export const sides: Side[] = ['top', 'right', 'bottom', 'left'];

export type SidesValue = Partial<Record<Side, SpacingValue>>;

export type SidesMode = 'all' | 'axis' | 'individual';
export const sidesModes: SidesMode[] = ['all', 'axis', 'individual'];

export type Axis = 'vertical' | 'horizontal';

const axisSides: Record<Axis, [Side, Side]> = {
  vertical: ['top', 'bottom'],
  horizontal: ['left', 'right'],
};

export const sidesModesFor = (allowed: Side[] = sides): SidesMode[] =>
  allowed.length === sides.length ? sidesModes : ['all', 'individual'];

const sideLabels: Record<Side, string> = {
  top: 'Top',
  right: 'Right',
  bottom: 'Bottom',
  left: 'Left',
};

export const sidesSchema = (
  name: string,
  unit: 'spacing' | 'px' = 'spacing',
  allowed: Side[] = sides
) => {
  const side = (label: string) =>
    unit === 'px' ?
      z.number().min(0).describe(`${label} ${name} in pixels`)
    : spacingSchema.describe(`${label} ${name}. ${spacingSchema.description}`);

  return z
    .object(
      Object.fromEntries(
        allowed.map(key => [key, side(sideLabels[key])])
      ) as Partial<Record<Side, ReturnType<typeof side>>>
    )
    .partial();
};

const withSides = (
  value: SidesValue,
  targets: Side[],
  amount: SpacingValue | undefined
): SidesValue => {
  const next = { ...value };

  for (const side of targets) {
    if (amount === undefined) {
      delete next[side];
    } else {
      next[side] = amount;
    }
  }

  return next;
};

export const getSidesMode = (
  value: SidesValue | undefined,
  allowed: Side[] = sides
): SidesMode => {
  const { top, right, bottom, left } = value ?? {};

  if (allowed.length !== sides.length) {
    return allowed.every(side => value?.[side] === value?.[allowed[0]]) ? 'all'
      : 'individual';
  }

  if (top === right && top === bottom && top === left) {
    return 'all';
  }

  if (top === bottom && left === right) {
    return 'axis';
  }

  return 'individual';
};

export const setAllSides = (
  amount: SpacingValue | undefined,
  allowed: Side[] = sides
): SidesValue => withSides({}, allowed, amount);

export const setAxis = (
  value: SidesValue,
  axis: Axis,
  amount: SpacingValue | undefined
): SidesValue => withSides(value, axisSides[axis], amount);

export const setSide = (
  value: SidesValue,
  side: Side,
  amount: SpacingValue | undefined
): SidesValue => withSides(value, [side], amount);

export const toSidesMode = (
  value: SidesValue,
  mode: SidesMode,
  allowed: Side[] = sides
): SidesValue => {
  switch (mode) {
    case 'all':
      return setAllSides(value[allowed[0]], allowed);
    case 'axis':
      return setAxis(
        setAxis(value, 'vertical', value.top),
        'horizontal',
        value.right ?? value.left
      );
    default:
      return value;
  }
};
