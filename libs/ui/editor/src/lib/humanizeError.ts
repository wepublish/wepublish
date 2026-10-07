import { ApolloError } from '@apollo/client';
import i18next from 'i18next';

type Translate = (key: string, options?: Record<string, unknown>) => string;

const UNIQUE_CONSTRAINT = /Unique constraint failed on the fields: \(`([^`]+)`/;
const FOREIGN_KEY_CONSTRAINT = /Foreign key constraint/i;
const DATABASE_INTERNALS = /Invalid `[^`]+` invocation|prisma/i;
const NETWORK_FAILURE = /Failed to fetch|NetworkError|Load failed/i;
const ACCESS_DENIED_CODES = ['FORBIDDEN', 'UNAUTHENTICATED'];

const defaultTranslate: Translate = (key, options) => i18next.t(key, options);

function explain(message: string, t: Translate) {
  const text = message.replace(/^ApolloError:\s*/, '').trim();
  const unique = text.match(UNIQUE_CONSTRAINT);

  if (unique) {
    return unique[1] === 'email' ?
        t('errors.uniqueEmail')
      : t('errors.uniqueField', { field: unique[1] });
  }

  if (FOREIGN_KEY_CONSTRAINT.test(text)) {
    return t('errors.inUse');
  }

  if (DATABASE_INTERNALS.test(text)) {
    return t('errors.unexpected');
  }

  if (/Forbidden resource/i.test(text)) {
    return t('errors.forbidden');
  }

  if (NETWORK_FAILURE.test(text)) {
    return t('errors.network');
  }

  return text || t('errors.unexpected');
}

export function humanizeError(
  error: unknown,
  t: Translate = defaultTranslate
): string {
  if (error instanceof ApolloError) {
    const [first] = error.graphQLErrors;

    if (!first && error.networkError) {
      return t('errors.network');
    }

    if (first && ACCESS_DENIED_CODES.includes(String(first.extensions?.code))) {
      return t('errors.forbidden');
    }

    return explain(first?.message ?? error.message, t);
  }

  if (error instanceof Error) {
    return explain(error.message, t);
  }

  if (typeof error === 'string') {
    return explain(error, t);
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return explain(error.message, t);
  }

  return t('errors.unexpected');
}
