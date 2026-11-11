import type { z } from 'zod/v4';

export type CrossFieldOptions<S extends z.ZodObject> = {
  path: readonly [keyof S['shape'] & string, ...(string | number)[]];
  error: string;
};

export type CrossFieldValue<
  S extends z.ZodObject,
  K extends keyof S['shape'],
> = {
  [P in K]: z.output<S['shape'][P]>;
};

export function crossField<
  S extends z.ZodObject,
  const K extends keyof S['shape'] & string,
>(
  schema: S,
  keys: readonly K[],
  check: (value: CrossFieldValue<S, K>) => boolean,
  options: CrossFieldOptions<S>
): S {
  const ownKeys: ReadonlySet<PropertyKey> = new Set(keys);
  const run = check as (value: unknown) => boolean;

  return schema.refine(value => run(value), {
    path: [...options.path],
    error: options.error,
    when: payload =>
      !payload.issues.some(issue => ownKeys.has(issue.path?.[0] ?? '')),
  });
}
