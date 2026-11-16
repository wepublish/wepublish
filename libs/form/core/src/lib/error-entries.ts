import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { FlatFieldError } from './field-errors';
import { isRootPath, schemaPathOf, withoutRoot } from './field-path';
import { evaluatedLabel, translateText } from './field-text';
import type { FormRuntime } from './form-runtime';
import type { Translate } from './form-types';
import { toOverride, type OverrideMap } from './overrides';
import { schemaAt, type BranchChoice } from './schema-at';
import type { FormFieldError } from './schema-resolver';

export type FormErrorEntry = {
  path: string;
  label?: ReactNode;
  message: string;
  focus?: () => void;
};

export function describeFieldError(
  t: Translate,
  error: FormFieldError
): string {
  const { message = '', params } = error;

  return params && Object.keys(params).length > 0 ?
      t(message, params)
    : t(message);
}

export const hasDynamicLabel = (fields: OverrideMap) =>
  Object.values(fields).some(
    override => typeof toOverride(override).label === 'function'
  );

const entryLabel = (
  runtime: FormRuntime,
  path: string,
  branches: BranchChoice,
  values: FieldValues
): ReactNode =>
  evaluatedLabel(
    toOverride(runtime.fields[schemaPathOf(path)]),
    isRootPath(path) ? undefined : (
      schemaAt(runtime.schema, withoutRoot(path), branches)
    ),
    values
  );

export function describeErrorEntry(
  runtime: FormRuntime,
  { path, error }: FlatFieldError,
  branches: BranchChoice,
  values: FieldValues
): FormErrorEntry {
  return {
    path,
    label: translateText(
      runtime.t,
      entryLabel(runtime, path, branches, values)
    ),
    message: describeFieldError(runtime.t, error),
  };
}
