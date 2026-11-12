import { toNestErrors } from '@hookform/resolvers';
import { get, type FieldError, type Resolver } from 'react-hook-form';
import type { z } from 'zod/v4';
import { collapseEmptyGroups } from './empty-groups';
import { defaultIssueKey, isEmptyValue } from './error-keys';
import type { AnyFormSchema, FormOutput, FormValues } from './value-types';

export type FormFieldError = FieldError & { params?: Record<string, unknown> };

const OMITTED_ISSUE_KEYS: ReadonlySet<string> = new Set([
  'code',
  'message',
  'path',
  'input',
  'inst',
  'continue',
  'errors',
]);

const paramsOf = (issue: z.core.$ZodIssue): Record<string, unknown> => {
  if (issue.code === 'custom') {
    return { ...issue.params };
  }

  return Object.fromEntries(
    Object.entries(issue).filter(([key]) => !OMITTED_ISSUE_KEYS.has(key))
  );
};

const leafIssue = (issue: z.core.$ZodIssue): z.core.$ZodIssue => {
  if (issue.code !== 'invalid_union') {
    return issue;
  }

  const first = issue.errors[0]?.[0];

  return first ?
      leafIssue({ ...first, path: [...issue.path, ...first.path] })
    : issue;
};

const unexpectedError = (): Record<string, FormFieldError> => ({
  'root.schema': { type: 'exception', message: 'form.errors.unexpected' },
});

export function schemaResolver<S extends AnyFormSchema>(
  schema: S
): Resolver<FormValues<S>, unknown, FormOutput<S>> {
  return async (values, _context, options) => {
    const input = collapseEmptyGroups(schema, values);
    let result: z.ZodSafeParseResult<FormOutput<S>>;

    try {
      result = await schema.safeParseAsync(input, { error: defaultIssueKey });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }

      return { values: {}, errors: toNestErrors(unexpectedError(), options) };
    }

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const flat: Record<string, FormFieldError> = {};

    for (const issue of result.error.issues) {
      const leaf = leafIssue(issue);
      const name =
        leaf.path.length ? leaf.path.map(String).join('.') : 'root.schema';

      if (flat[name]) {
        continue;
      }

      const message =
        (
          leaf.code === 'invalid_union' &&
          leaf.message === 'form.errors.invalid' &&
          isEmptyValue(get(input, name))
        ) ?
          'form.errors.required'
        : leaf.message;

      flat[name] = { type: leaf.code, message, params: paramsOf(leaf) };
    }

    return { values: {}, errors: toNestErrors(flat, options) };
  };
}
