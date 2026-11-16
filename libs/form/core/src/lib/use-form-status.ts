import {
  useFormContext,
  useFormState,
  type FieldValues,
  type FormState,
} from 'react-hook-form';
import { describeFieldError } from './error-entries';
import { fieldErrorOf } from './field-errors';
import { useFormRuntime, type FormRuntime } from './form-runtime';

export type FormStatus = {
  readonly isSubmitting: boolean;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly isLoading: boolean;
  readonly loadError: unknown;
  readonly canSubmit: boolean;
  readonly serverError: string | undefined;
};

function subscribedStatus(
  state: FormState<FieldValues>,
  runtime: FormRuntime
): FormStatus {
  return {
    get isSubmitting() {
      return state.isSubmitting;
    },
    get isDirty() {
      return state.isDirty;
    },
    get isValid() {
      return state.isValid;
    },
    isLoading: runtime.status === 'loading',
    loadError: runtime.loadError,
    get canSubmit() {
      return (
        runtime.status === 'ready' && !runtime.disabled && !state.isSubmitting
      );
    },
    get serverError() {
      const error = fieldErrorOf(state.errors.root?.['server'], false);

      return error === undefined ? undefined : (
          describeFieldError(runtime.t, error)
        );
    },
  };
}

export function useFormStatus(): FormStatus {
  const runtime = useFormRuntime();
  const form = useFormContext();
  const state = useFormState({ control: form.control });

  return subscribedStatus(state, runtime);
}
