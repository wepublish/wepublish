import { get, useFormContext, useFormState } from 'react-hook-form';
import type { FormErrorEntry } from './error-entries';
import { flattenErrors } from './field-errors';
import { useErrorEntries } from './use-error-entries';

export function useFieldErrors(
  paths: string | readonly string[]
): FormErrorEntry[] {
  const form = useFormContext();
  const names = typeof paths === 'string' ? [paths] : paths;
  const { errors } = useFormState({ control: form.control, name: names });

  return useErrorEntries(
    names.flatMap(path => flattenErrors(get(errors, path), path))
  );
}
