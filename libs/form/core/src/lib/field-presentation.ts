import type { ReactNode } from 'react';
import { isRequired } from './cleared-value';
import { insideOptionalGroup } from './empty-groups';
import { describeFieldError } from './error-entries';
import { fieldInfo, type FieldInfo } from './field-info';
import { translateText } from './field-text';
import type { FieldRuntime, FormRuntime } from './form-runtime';
import { fieldMeta } from './meta';
import type { FormFieldError } from './schema-resolver';

export type FieldPresentation = {
  name: string;
  id: string;
  label: ReactNode;
  description: ReactNode;
  helperText: ReactNode;
  placeholder: string | undefined;
  hideLabel: boolean;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  error: string | undefined;
  invalid: boolean;
  info: FieldInfo;
  kind: string | undefined;
  kindParams: unknown;
};

export function fieldPresentation(
  runtime: FormRuntime,
  field: FieldRuntime,
  error: FormFieldError | undefined
): FieldPresentation {
  const { override, schema } = field;
  const meta = fieldMeta(schema);
  const placeholder = override.placeholder ?? meta.placeholder;

  return {
    name: field.path,
    id: `${runtime.idPrefix}-${field.path}`,
    label: translateText(runtime.t, override.label ?? meta.label),
    description: translateText(
      runtime.t,
      override.description ?? meta.description
    ),
    helperText: translateText(
      runtime.t,
      override.helperText ?? meta.helperText
    ),
    placeholder: placeholder === undefined ? undefined : runtime.t(placeholder),
    hideLabel: override.hideLabel === true,
    required:
      override.required ??
      (isRequired(schema) &&
        !insideOptionalGroup(runtime.schema, field.name, field.branches)),
    disabled:
      runtime.disabled ||
      runtime.status !== 'ready' ||
      override.disabled === true,
    readOnly: override.readOnly === true,
    error:
      error === undefined ? undefined : describeFieldError(runtime.t, error),
    invalid: error !== undefined,
    info: fieldInfo(schema),
    kind: field.kind,
    kindParams: field.kindParams,
  };
}
