import type { z } from 'zod/v4';
import { valueSchema } from './kind';
import { fieldMeta } from './meta';
import { defOf } from './zod-def';

type Bound = number | bigint | Date;

export type FieldInfo = {
  format?: string;
  patterns?: RegExp[];
  minLength?: number;
  maxLength?: number;
  minimum?: Bound;
  maximum?: Bound;
  exclusiveMinimum?: Bound;
  exclusiveMaximum?: Bound;
  multipleOf?: number | bigint;
  integer?: true;
};

export type OptionValue = string | number | bigint | boolean;

export type FieldOption = { value: OptionValue; labelKey: string | undefined };

const INTEGER_FORMATS: ReadonlySet<unknown> = new Set([
  'safeint',
  'int32',
  'uint32',
]);

const IMPLICIT_BOUNDS: ReadonlySet<unknown> = new Set([
  Number.MIN_SAFE_INTEGER,
  Number.MAX_SAFE_INTEGER,
  -Number.MAX_VALUE,
  Number.MAX_VALUE,
]);

const isBound = (value: unknown): value is Bound =>
  typeof value === 'number' ||
  typeof value === 'bigint' ||
  value instanceof Date;

const isLength = (value: unknown): value is number => typeof value === 'number';

const explicitBound = (value: unknown): Bound | undefined =>
  isBound(value) && !IMPLICIT_BOUNDS.has(value) ? value : undefined;

const withoutUndefined = (info: FieldInfo): FieldInfo =>
  Object.fromEntries(
    Object.entries(info).filter(([, value]) => value !== undefined)
  );

export function fieldInfo(schema: z.ZodType): FieldInfo {
  const inner = valueSchema(schema);
  const { bag } = inner._zod;
  const type = defOf(inner).type;

  if (type === 'string') {
    const format =
      typeof bag['format'] === 'string' ? bag['format'] : undefined;
    const patterns = bag['patterns'] instanceof Set ? [...bag['patterns']] : [];
    const regexes = patterns.filter(pattern => pattern instanceof RegExp);

    return withoutUndefined({
      format,
      patterns: format === 'regex' ? regexes : undefined,
      minLength: isLength(bag['minimum']) ? bag['minimum'] : undefined,
      maxLength: isLength(bag['maximum']) ? bag['maximum'] : undefined,
    });
  }

  if (type === 'array') {
    return withoutUndefined({
      minLength: isLength(bag['minimum']) ? bag['minimum'] : undefined,
      maxLength: isLength(bag['maximum']) ? bag['maximum'] : undefined,
    });
  }

  if (type === 'number' || type === 'date' || type === 'bigint') {
    const multipleOf = bag['multipleOf'];
    const isStep =
      typeof multipleOf === 'number' || typeof multipleOf === 'bigint';

    return withoutUndefined({
      minimum: explicitBound(bag['minimum']),
      maximum: explicitBound(bag['maximum']),
      exclusiveMinimum: explicitBound(bag['exclusiveMinimum']),
      exclusiveMaximum: explicitBound(bag['exclusiveMaximum']),
      multipleOf: isStep ? multipleOf : undefined,
      integer: INTEGER_FORMATS.has(bag['format']) ? true : undefined,
    });
  }

  return {};
}

const isOptionValue = (value: unknown): value is OptionValue =>
  value !== '' &&
  (typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean');

const elementOf = (schema: z.ZodType) => {
  const def = defOf(valueSchema(schema));

  return def.type === 'array' ? def.element : undefined;
};

export function optionLabelPrefix(schema: z.ZodType): string | undefined {
  const element = elementOf(schema);

  return (
    fieldMeta(schema).optionLabelPrefix ??
    (element ? fieldMeta(element).optionLabelPrefix : undefined)
  );
}

export const optionLabelKey = (
  prefix: string | undefined,
  value: OptionValue
) => (prefix === undefined ? undefined : `${prefix}${String(value)}`);

export function fieldOptions(schema: z.ZodType): FieldOption[] {
  const element = elementOf(schema);
  const source = valueSchema(element ?? schema);
  const prefix = optionLabelPrefix(schema);

  return [...(source._zod.values ?? [])].filter(isOptionValue).map(value => ({
    value,
    labelKey: optionLabelKey(prefix, value),
  }));
}
