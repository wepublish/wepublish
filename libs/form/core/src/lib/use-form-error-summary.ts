import { useEffect, useSyncExternalStore } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import type { FormErrorEntry } from './error-entries';
import { flattenErrors } from './field-errors';
import { reaches } from './field-registry';
import { useFormRuntime } from './form-runtime';
import { SERVER_ERROR_PATH } from './set-field-error';
import { useErrorEntries } from './use-error-entries';

export function useFormErrorSummary(): FormErrorEntry[] {
  const runtime = useFormRuntime();
  const form = useFormContext();
  const { errorSummary, fieldRegistry } = runtime;
  const registered = useSyncExternalStore(
    fieldRegistry.subscribe,
    fieldRegistry.snapshot,
    fieldRegistry.snapshot
  );
  const { errors } = useFormState({ control: form.control });

  useEffect(() => errorSummary.mount(), [errorSummary]);

  return useErrorEntries(
    flattenErrors(errors).filter(
      ({ path }) => path !== SERVER_ERROR_PATH && !reaches(registered, path)
    )
  );
}
