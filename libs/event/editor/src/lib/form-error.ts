import { formErrorValues } from './event-form-schema';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export const translateFormError = (
  t: Translate,
  message: string | undefined
): string | undefined =>
  message ? t(message, formErrorValues(message)) : undefined;
