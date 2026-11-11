import type { ReactNode } from 'react';
import { get, useFormContext, useFormState } from 'react-hook-form';
import { fieldErrorOf } from './field-errors';
import { joinPath } from './field-path';
import {
  fieldPresentation,
  type FieldPresentation,
} from './field-presentation';
import { useFieldRuntime, useFormRuntime } from './form-runtime';
import type { ChildOverride } from './override-types';
import { toOverride } from './overrides';
import { branchShape } from './schema-at';
import { SchemaField } from './schema-field';

export type UseObjectFieldReturn = FieldPresentation & {
  keys: string[];
  renderField: (key: string, override?: ChildOverride) => ReactNode;
};

export function useObjectField(): UseObjectFieldReturn {
  const field = useFieldRuntime('useObjectField');
  const runtime = useFormRuntime();
  const form = useFormContext();
  const { errors } = useFormState({ control: form.control, name: field.path });

  return {
    ...fieldPresentation(
      runtime,
      field,
      fieldErrorOf(get(errors, field.path), true)
    ),
    keys: Object.keys(branchShape(field.schema) ?? {}),
    renderField: (key, override) => (
      <SchemaField
        key={key}
        name={joinPath(field.name, key)}
        call={toOverride(override)}
      />
    ),
  };
}
