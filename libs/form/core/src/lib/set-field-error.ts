import type {
  ErrorOption,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';

export const SERVER_ERROR_PATH = 'root.server';

export type FieldErrorPath<T extends FieldValues> =
  FieldPath<T> | `root.${string}`;

export function setFieldError<T extends FieldValues, C, O>(
  form: UseFormReturn<T, C, O>,
  path: FieldErrorPath<T>,
  key: string,
  params?: Record<string, unknown>
): void {
  const error: ErrorOption & { params: Record<string, unknown> | undefined } = {
    type: 'server',
    message: key,
    params,
  };

  form.setError(path, error);
}
