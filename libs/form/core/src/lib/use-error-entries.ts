import {
  get,
  useFormContext,
  useWatch,
  type Control,
  type Field,
  type FieldValues,
} from 'react-hook-form';
import {
  describeErrorEntry,
  hasDynamicLabel,
  type FormErrorEntry,
} from './error-entries';
import type { FlatFieldError } from './field-errors';
import { isRootPath, withoutRoot } from './field-path';
import { useFormRuntime, type FormRuntime } from './form-runtime';
import { branchChoice, unionGates } from './union-gates';

const gatesOf = (runtime: FormRuntime, path: string) =>
  isRootPath(path) ? [] : unionGates(runtime.schema, withoutRoot(path), {});

const isMounted = (control: Control, path: string) => {
  const field: Partial<Field> | undefined = get(control._fields, path);

  return field?._f?.mount === true;
};

export function useErrorEntries(
  errors: readonly FlatFieldError[]
): FormErrorEntry[] {
  const runtime = useFormRuntime();
  const form = useFormContext();
  const gates = errors.flatMap(({ path }) => gatesOf(runtime, path));
  const discriminants: unknown[] = useWatch({
    control: form.control,
    name: gates.map(gate => gate.discriminatorPath),
  });
  const values: FieldValues = useWatch({
    control: form.control,
    disabled: !hasDynamicLabel(runtime.fields),
  });
  const branches = branchChoice(gates, discriminants);

  return errors.map(entry => {
    const described = describeErrorEntry(runtime, entry, branches, values);

    return isMounted(form.control, entry.path) ?
        { ...described, focus: () => form.setFocus(entry.path) }
      : described;
  });
}
