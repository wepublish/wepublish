import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod/v4';
import { collapseEmptyGroups } from './empty-groups';
import { isSameValue } from './same-value';
import { isPlainObject } from './zod-def';

const formSchemas = new WeakMap<object, z.ZodType>();

export const rememberFormSchema = (control: object, schema: z.ZodType) => {
  formSchemas.set(control, schema);
};

export type ChangedEntry<T extends FieldValues> = {
  readonly key: Extract<keyof T, string>;
  readonly before: unknown;
  readonly after: unknown;
};

function changes<T extends FieldValues, C, O>(form: UseFormReturn<T, C, O>) {
  const values = form.getValues();
  const defaults: Record<string, unknown> = form.formState.defaultValues ?? {};
  const schema = formSchemas.get(form.control);
  const current = comparable(schema, values);
  const initial = comparable(schema, defaults);
  const keys = Object.keys(values).filter(
    key => !isSameValue(current[key], initial[key])
  ) as Extract<keyof T, string>[];

  return { values, defaults, keys };
}

export function getChangedValues<T extends FieldValues, C, O>(
  form: UseFormReturn<T, C, O>
): Partial<T> {
  const { values, keys } = changes(form);
  const changed: Partial<T> = {};

  for (const key of keys) {
    changed[key] = values[key];
  }

  return changed;
}

export function getChangedEntries<T extends FieldValues, C, O>(
  form: UseFormReturn<T, C, O>
): ChangedEntry<T>[] {
  const { values, defaults, keys } = changes(form);

  return keys.map(key => ({
    key,
    before: defaults[key],
    after: values[key],
  }));
}

function comparable(
  schema: z.ZodType | undefined,
  values: Record<string, unknown>
) {
  const collapsed =
    schema === undefined ? values : collapseEmptyGroups(schema, values);

  return isPlainObject(collapsed) ? collapsed : values;
}
