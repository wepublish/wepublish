import type { z } from 'zod/v4';
import { schemaLayers } from './kind';

declare module 'zod/v4/core' {
  interface GlobalMeta {
    label?: string;
    description?: string;
    helperText?: string;
    placeholder?: string;
    optionLabelPrefix?: string;
  }
}

export const formMetaKeys = [
  'label',
  'description',
  'helperText',
  'placeholder',
  'optionLabelPrefix',
] as const;

export type FormMetaKey = (typeof formMetaKeys)[number];

export type FormMeta = Pick<z.core.GlobalMeta, FormMetaKey>;

const zodMetaKeys = ['id', 'title', 'examples', 'deprecated'];

const knownMetaKeys: ReadonlySet<string> = new Set([
  ...formMetaKeys,
  ...zodMetaKeys,
]);

const derivedMeta = new WeakMap<z.ZodType, FormMeta>();

export function withDerivedMeta<S extends z.ZodType>(
  schema: S,
  meta: FormMeta
): S {
  derivedMeta.set(schema, meta);

  return schema;
}

export function fieldMeta(schema: z.ZodType): FormMeta {
  const merged: z.core.GlobalMeta = Object.assign(
    {},
    ...schemaLayers(schema)
      .reverse()
      .map(layer => ({ ...derivedMeta.get(layer), ...layer.meta() }))
  );
  const unknown = Object.keys(merged).filter(key => !knownMetaKeys.has(key));

  if (unknown.length && process.env.NODE_ENV !== 'production') {
    throw new Error(
      `Unknown form meta key(s) ${unknown.map(key => `"${key}"`).join(', ')}.`
    );
  }

  const meta: FormMeta = {};

  for (const key of formMetaKeys) {
    if (merged[key] !== undefined) {
      meta[key] = merged[key];
    }
  }

  return meta;
}
