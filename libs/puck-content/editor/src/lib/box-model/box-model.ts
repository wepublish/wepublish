import { SpacingValue } from '../spacing/spacing';

export type SpacingInputResult =
  { valid: true; value: SpacingValue | undefined } | { valid: false };

export type SpacingKeysValue<Key extends string> = Partial<
  Record<Key, SpacingValue>
>;

const unitsPattern = /^\d+(\.\d*)?$/;
const pixelsPattern = /^(\d+(?:\.\d+)?)\s*px$/;

export const parseSpacingInput = (raw: string): SpacingInputResult => {
  const input = raw.trim().toLowerCase().replace(',', '.');

  if (!input) {
    return { valid: true, value: undefined };
  }

  if (unitsPattern.test(input)) {
    return { valid: true, value: parseFloat(input) };
  }

  const pixels = input.match(pixelsPattern);

  if (pixels) {
    return { valid: true, value: `${parseFloat(pixels[1])}px` };
  }

  return { valid: false };
};

export const formatSpacingInput = (value: SpacingValue | undefined) =>
  value === undefined ? '' : `${value}`;

const roundStep = (value: number) => Math.round(value * 100) / 100;

export const stepSpacingValue = (
  value: SpacingValue | undefined,
  delta: number
): SpacingValue => {
  if (typeof value === 'string') {
    return `${Math.max(0, roundStep(parseFloat(value) + delta))}px`;
  }

  return Math.max(0, roundStep((value ?? 0) + delta));
};

export const setSpacingKeys = <Key extends string>(
  value: SpacingKeysValue<Key> | undefined,
  keys: readonly Key[],
  amount: SpacingValue | undefined
): SpacingKeysValue<Key> => {
  const next: SpacingKeysValue<Key> = { ...value };

  for (const key of keys) {
    if (amount === undefined) {
      delete next[key];
    } else {
      next[key] = amount;
    }
  }

  return next;
};

export const areSpacingKeysUniform = <Key extends string>(
  value: SpacingKeysValue<Key> | undefined,
  keys: readonly Key[]
) => keys.every(key => value?.[key] === value?.[keys[0]]);

export const linkSpacingKeys = <Key extends string>(
  value: SpacingKeysValue<Key> | undefined,
  keys: readonly Key[]
): SpacingKeysValue<Key> => {
  const first = keys
    .map(key => value?.[key])
    .find((amount): amount is SpacingValue => amount !== undefined);

  return setSpacingKeys(value, keys, first);
};
