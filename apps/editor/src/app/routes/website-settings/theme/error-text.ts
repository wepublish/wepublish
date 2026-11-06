import type { TFunction } from 'i18next';
import type { FieldError } from 'react-hook-form';

type ParamsError = FieldError & { params?: Record<string, unknown> };

export const errorText = (t: TFunction, error: FieldError | undefined) => {
  const { message, params } = (error ?? {}) as ParamsError;

  if (!message) {
    return undefined;
  }

  return params && Object.keys(params).length > 0 ?
      t(message, params)
    : t(message);
};

export const translatedError = (
  t: TFunction,
  error: FieldError | undefined
): FieldError | undefined =>
  error === undefined ? undefined : { ...error, message: errorText(t, error) };
