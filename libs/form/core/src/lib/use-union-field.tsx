import { useEffect, type ReactNode } from 'react';
import {
  get,
  useFormContext,
  useFormState,
  useWatch,
  type FieldValues,
} from 'react-hook-form';
import { fieldErrorOf } from './field-errors';
import { joinPath } from './field-path';
import {
  fieldPresentation,
  type FieldPresentation,
} from './field-presentation';
import { labelledOptions, type FieldOptionItem } from './field-text';
import { useFieldRuntime, useFormRuntime } from './form-runtime';
import { mergeOverrides } from './overrides';
import {
  activeBranch,
  branchShape,
  discriminatedUnionOf,
  schemaAt,
} from './schema-at';
import { SchemaField } from './schema-field';
import { switchBranch } from './switch-branch';

export type UseUnionFieldReturn = FieldPresentation & {
  discriminator: string;
  options: FieldOptionItem[];
  active: unknown;
  setType: (discriminant: unknown) => void;
  renderBranch: () => ReactNode;
};

export function useUnionField(): UseUnionFieldReturn {
  const field = useFieldRuntime('useUnionField');
  const runtime = useFormRuntime();
  const form = useFormContext();
  const union = discriminatedUnionOf(field.schema);
  const discriminator = union?.discriminator ?? '';
  const discriminatorName = joinPath(field.name, discriminator);
  const discriminatorPath = joinPath(field.path, discriminator);
  const { options, optionLabel } = mergeOverrides(
    runtime.fields,
    discriminatorName
  );
  const active: unknown = useWatch({
    control: form.control,
    name: discriminatorPath,
  });
  const values: FieldValues = useWatch({
    control: form.control,
    disabled: typeof options !== 'function',
  });
  const { errors } = useFormState({ control: form.control, name: field.path });
  const { fieldRegistry } = runtime;

  useEffect(
    () => fieldRegistry.register(discriminatorPath, true),
    [fieldRegistry, discriminatorPath]
  );

  if (union === undefined) {
    throw new Error(
      `useUnionField needs a discriminated union at "${field.name}".`
    );
  }

  const discriminatorSchema =
    schemaAt(field.schema, discriminator) ?? field.schema;
  const branch = activeBranch(field.schema, { [discriminator]: active });
  const keys = Object.keys((branch && branchShape(branch)) ?? {}).filter(
    key => key !== discriminator
  );
  const error =
    fieldErrorOf(get(errors, field.path), true) ??
    fieldErrorOf(get(errors, discriminatorPath), false);

  return {
    ...fieldPresentation(runtime, field, error),
    discriminator,
    options: labelledOptions(
      discriminatorSchema,
      {
        options: typeof options === 'function' ? options(values) : options,
        optionLabel,
      },
      runtime.t
    ),
    active,
    setType: discriminant =>
      switchBranch(form, field.schema, field.path, discriminant),
    renderBranch: () =>
      keys.map(key => (
        <SchemaField
          key={key}
          name={joinPath(field.name, key)}
        />
      )),
  };
}
