export interface PlaceholderSyntax {
  open: string;
  close: string;
}

/**
 * Returns the placeholder wrapping syntax for a given mail provider, keyed off
 * the provider TYPE (reliable) rather than the configurable display name:
 * Mailchimp/Mandrill uses `*|KEY|*` merge vars, Mailgun uses handlebars
 * `{{ KEY }}`. Falls back to handlebars syntax for unknown providers.
 */
export const getPlaceholderSyntax = (
  providerType?: string | null
): PlaceholderSyntax => {
  switch ((providerType ?? '').toUpperCase()) {
    case 'MAILCHIMP':
      return { open: '*|', close: '|*' };
    case 'MAILGUN':
      return { open: '{{', close: '}}' };
    default:
      return { open: '{{', close: '}}' };
  }
};

export const formatPlaceholder = (
  key: string,
  syntax: PlaceholderSyntax
): string => `${syntax.open}${key}${syntax.close}`;

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a global RegExp matching any placeholder token for the given syntax,
 * capturing the inner key. Used to turn provider tokens back into editor chips.
 */
export const placeholderTokenRegExp = (syntax: PlaceholderSyntax): RegExp =>
  new RegExp(
    `${escapeRegExp(syntax.open)}\\s*([\\w.]+)\\s*${escapeRegExp(syntax.close)}`,
    'g'
  );

/**
 * Replaces placeholder tokens in an HTML string with example values so the
 * live preview shows realistic content instead of raw tokens.
 */
export const applyPlaceholderExamples = (
  html: string,
  examples: Record<string, string>,
  syntax: PlaceholderSyntax
): string =>
  html.replace(placeholderTokenRegExp(syntax), (match, key: string) =>
    key in examples ? examples[key] : match
  );
