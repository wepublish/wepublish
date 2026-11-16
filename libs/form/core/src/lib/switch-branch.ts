import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod/v4';
import { joinPath } from './field-path';
import { branchEmpty } from './initial-values';
import { activeBranch, branchShape, discriminatedUnionOf } from './schema-at';
import { accepts, isPlainObject } from './zod-def';

const currentValue = (
  form: UseFormReturn<FieldValues>,
  path: string
): unknown => (path === '' ? form.getValues() : form.getValues(path));

export function switchBranch(
  form: UseFormReturn<FieldValues>,
  unionSchema: z.ZodType,
  path: string,
  discriminant: unknown
) {
  const union = discriminatedUnionOf(unionSchema);
  const branch =
    union === undefined ? undefined : (
      activeBranch(unionSchema, { [union.discriminator]: discriminant })
    );

  if (union === undefined || branch === undefined) {
    form.setValue(joinPath(path, union?.discriminator ?? ''), discriminant, {
      shouldDirty: true,
    });

    return;
  }

  const current = currentValue(form, path);
  const previous = isPlainObject(current) ? current : {};
  const shape = branchShape(branch) ?? {};

  const keeps = (key: string) => {
    const schema: z.ZodType | undefined = shape[key];

    return (
      key !== union.discriminator &&
      Object.hasOwn(previous, key) &&
      schema !== undefined &&
      accepts(schema, previous[key])
    );
  };

  const next = Object.fromEntries(
    Object.entries(branchEmpty(branch, union.discriminator)).map(
      ([key, empty]) => [key, keeps(key) ? previous[key] : empty]
    )
  );

  if (path === '') {
    form.reset(next, {
      keepDefaultValues: true,
      keepTouched: true,
      keepIsSubmitted: true,
      keepSubmitCount: true,
    });

    return;
  }

  form.setValue(path, next, { shouldDirty: true });
  form.clearErrors(path);
}
