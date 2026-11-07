import { z } from 'zod/v4';

export const WRAPPER_TYPES = [
  'optional',
  'nullable',
  'default',
  'prefault',
  'readonly',
  'catch',
  'nonoptional',
] as const;

export type WrapperType = (typeof WRAPPER_TYPES)[number];

type HandledType =
  | WrapperType
  | 'pipe'
  | 'lazy'
  | 'object'
  | 'array'
  | 'union'
  | 'enum'
  | 'literal';

export type SchemaDef =
  | {
      type: Exclude<WrapperType, 'default' | 'prefault'>;
      innerType: z.ZodType;
    }
  | {
      type: 'default' | 'prefault';
      innerType: z.ZodType;
      defaultValue: unknown;
    }
  | { type: 'pipe'; in: z.ZodType; out: z.ZodType }
  | { type: 'lazy'; getter: () => z.ZodType }
  | { type: 'object'; shape: Readonly<Record<string, z.ZodType>> }
  | { type: 'array'; element: z.ZodType }
  | {
      type: 'union';
      options: readonly z.ZodType[];
      discriminator?: string;
    }
  | { type: 'enum'; entries: Readonly<Record<string, string | number>> }
  | { type: 'literal'; values: readonly unknown[] }
  | { type: Exclude<z.core.$ZodTypeDef['type'], HandledType> };

export const defOf = (schema: z.ZodType): SchemaDef =>
  schema._zod.def as unknown as SchemaDef;

const wrapperTypes: ReadonlySet<string> = new Set(WRAPPER_TYPES);

export const isWrapperDef = (
  def: SchemaDef
): def is Extract<SchemaDef, { innerType: z.ZodType }> =>
  wrapperTypes.has(def.type);

export const isEmptyStringLiteral = (schema: z.ZodType) => {
  const def = defOf(schema);

  return (
    def.type === 'literal' && def.values.length === 1 && def.values[0] === ''
  );
};

export const accepts = (schema: z.ZodType, value: unknown) => {
  try {
    return schema.safeParse(value).success;
  } catch (error) {
    return error instanceof z.core.$ZodAsyncError;
  }
};

export const isPlainObject = (
  value: unknown
): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
};
