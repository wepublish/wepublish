import type { z } from 'zod/v4';
import { defOf } from './zod-def';

type Settled = { readonly value: unknown };

const settled = new WeakMap<z.ZodType, Settled>();

export function settledDefault(schema: z.ZodType): Settled | undefined {
  const def = defOf(schema);

  if (def.type !== 'default' && def.type !== 'prefault') {
    return undefined;
  }

  const known = settled.get(schema);

  if (known) {
    return known;
  }

  const entry: Settled = { value: def.defaultValue };

  settled.set(schema, entry);

  return entry;
}
