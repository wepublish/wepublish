import type { z } from 'zod/v4';
import { schemaLayers, valueSchema } from './kind';
import { accepts, defOf, isEmptyStringLiteral } from './zod-def';

export const withoutDefaults = (schema: z.ZodType): z.ZodType => {
  const def = defOf(schema);

  return def.type === 'default' || def.type === 'prefault' ?
      withoutDefaults(def.innerType)
    : schema;
};

const hasEmptyStringOption = (schema: z.ZodType) =>
  schemaLayers(schema).some(layer => {
    const def = defOf(layer);

    return def.type === 'union' && def.options.some(isEmptyStringLiteral);
  });

const valueType = (schema: z.ZodType) => defOf(valueSchema(schema)).type;

export function clearedValue(input: z.ZodType): unknown {
  const schema = withoutDefaults(input);
  const type = valueType(schema);

  if (type === 'array') {
    return [];
  }

  if (type === 'boolean') {
    return false;
  }

  if (type === 'string' && schema !== input && !accepts(schema, null)) {
    return null;
  }

  const candidates: unknown[] =
    type === 'string' ?
      ['', null, undefined]
    : [null, undefined, ...(hasEmptyStringOption(schema) ? [''] : [])];
  const index = candidates.findIndex(candidate => accepts(schema, candidate));

  if (index === -1) {
    return type === 'string' ? '' : null;
  }

  return candidates[index];
}

const isEmptyInitial = (value: unknown) => value === null || value === '';

export function clearedValueOver(input: z.ZodType, initial: unknown): unknown {
  const cleared = clearedValue(input);
  const schema = withoutDefaults(input);

  return (
      isEmptyInitial(initial) &&
        accepts(schema, initial) &&
        accepts(schema, cleared)
    ) ?
      initial
    : cleared;
}

export function isRequired(schema: z.ZodType): boolean {
  if (valueType(schema) === 'boolean') {
    return false;
  }

  return !accepts(withoutDefaults(schema), clearedValue(schema));
}
