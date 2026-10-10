import { describeError } from '@wepublish/utils/api';

interface MailchimpFieldError {
  field?: string;
  message?: string;
}

interface MailchimpProblem {
  title?: string;
  detail?: string;
  errors?: MailchimpFieldError[];
}

type MailchimpRejection = MailchimpProblem & {
  response?: { body?: MailchimpProblem };
};

/**
 * Mailchimp answers with a problem document whose detail often only points
 * to its `errors` array ("Invalid Resource"), so the rejected fields are
 * listed after title and detail.
 */
export const describeMailchimpError = (error: unknown): string => {
  const rejection = error as MailchimpRejection | null | undefined;
  const problem = rejection?.response?.body ?? rejection;

  if (!problem?.detail) {
    return describeError(error);
  }

  const description =
    problem.title ? `${problem.title}: ${problem.detail}` : problem.detail;
  const fieldErrors = (Array.isArray(problem.errors) ? problem.errors : [])
    .map(({ field, message }) => (field ? `${field}: ${message}` : message))
    .filter(Boolean);

  return fieldErrors.length ?
      `${description} (${fieldErrors.join('; ')})`
    : description;
};
