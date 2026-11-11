import {
  get,
  useController,
  useFormContext,
  useFormState,
  useWatch,
  type RefCallBack,
} from 'react-hook-form';
import { clearedValueOver } from './cleared-value';
import { fieldActions } from './field-actions';
import { fieldErrorOf } from './field-errors';
import { lastSegment, parentPath } from './field-path';
import {
  fieldPresentation,
  type FieldPresentation,
} from './field-presentation';
import { labelledOptions, type FieldOptionItem } from './field-text';
import { useFieldRuntime, useFormRuntime } from './form-runtime';
import { discriminatedUnionOf, schemaAt } from './schema-at';
import { switchBranch } from './switch-branch';

export type UseFieldReturn<T> = FieldPresentation & {
  value: T;
  onChange: (next: T) => void;
  onBlur: () => void;
  ref: RefCallBack;
  options: FieldOptionItem[];
};

const isEmptyInput = (value: unknown) =>
  value === '' || value === null || value === undefined;

export function useField<T = unknown>(): UseFieldReturn<T> {
  const field = useFieldRuntime('useField');
  const runtime = useFormRuntime();
  const form = useFormContext();
  const { field: controller, fieldState } = useController({
    control: form.control,
    name: field.path,
  });
  const current: T = useWatch({
    control: form.control,
    name: field.path,
    exact: true,
  });
  const { defaultValues } = useFormState({
    control: form.control,
    name: field.path,
    exact: true,
  });
  const { override, schema } = field;
  const actions = fieldActions(form);
  const parentName = parentPath(field.name);
  const parentSchema = schemaAt(runtime.schema, parentName, field.branches);
  const union =
    parentSchema === undefined ? undefined : discriminatedUnionOf(parentSchema);
  const branchSwitch =
    (
      parentSchema !== undefined &&
      union?.discriminator === lastSegment(field.name)
    ) ?
      parentSchema
    : undefined;

  const onChange = (next: T) => {
    const normalized = override.normalize ? override.normalize(next) : next;

    if (override.guard && !override.guard(normalized, actions)) {
      return;
    }

    const value =
      isEmptyInput(normalized) ?
        clearedValueOver(schema, get(defaultValues, field.path))
      : normalized;

    if (branchSwitch) {
      switchBranch(form, branchSwitch, parentPath(field.path), value);
    } else {
      controller.onChange(value);
    }

    override.onValueChange?.(value, actions);
  };

  return {
    ...fieldPresentation(runtime, field, fieldErrorOf(fieldState.error, false)),
    value: current,
    onChange,
    onBlur: controller.onBlur,
    ref: controller.ref,
    options: labelledOptions(schema, override, runtime.t),
  };
}
