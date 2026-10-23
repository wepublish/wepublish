import { formErrorValues } from './event-form-schema';
import { ORGANIZATION_ERROR_VALUES } from './organization/organization-form-schema';
import { VENUE_ERROR_VALUES } from './venue/venue-form-schema';

type Translate = (key: string, options?: Record<string, unknown>) => string;

const errorValues = (message: string) =>
  ORGANIZATION_ERROR_VALUES[message] ??
  VENUE_ERROR_VALUES[message] ??
  formErrorValues(message);

export const translateFormError = (
  t: Translate,
  message: string | undefined
): string | undefined =>
  message ? t(message, errorValues(message)) : undefined;
