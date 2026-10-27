import { z } from 'zod/v4';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export const sides: Side[] = ['top', 'right', 'bottom', 'left'];

export type SidesValue = Partial<Record<Side, number>>;

export type SidesMode = 'all' | 'axis' | 'individual';
export const sidesModes: SidesMode[] = ['all', 'axis', 'individual'];

export type Axis = 'vertical' | 'horizontal';

const axisSides: Record<Axis, [Side, Side]> = {
  vertical: ['top', 'bottom'],
  horizontal: ['left', 'right'],
};

export const sidesSchema = (unit: string) =>
  z
    .object({
      top: z.number().min(0).describe(`Top ${unit} in pixels`),
      right: z.number().min(0).describe(`Right ${unit} in pixels`),
      bottom: z.number().min(0).describe(`Bottom ${unit} in pixels`),
      left: z.number().min(0).describe(`Left ${unit} in pixels`),
    })
    .partial();

const withSides = (
  value: SidesValue,
  targets: Side[],
  amount: number | undefined
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

export const getSidesMode = (value: SidesValue | undefined): SidesMode => {
  const { top, right, bottom, left } = value ?? {};

  if (top === right && top === bottom && top === left) {
    return 'all';
  }

  if (top === bottom && left === right) {
    return 'axis';
  }

  return 'individual';
};

export const setAllSides = (amount: number | undefined): SidesValue =>
  withSides({}, sides, amount);

export const setAxis = (
  value: SidesValue,
  axis: Axis,
  amount: number | undefined
): SidesValue => withSides(value, axisSides[axis], amount);

export const setSide = (
  value: SidesValue,
  side: Side,
  amount: number | undefined
): SidesValue => withSides(value, [side], amount);

export const toSidesMode = (value: SidesValue, mode: SidesMode): SidesValue => {
  switch (mode) {
    case 'all':
      return setAllSides(value.top);
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
