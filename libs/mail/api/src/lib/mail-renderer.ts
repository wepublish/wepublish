/**
 * Local mail composition.
 *
 * Templates are stored and edited inside wepublish and the variable
 * substitution happens here, locally, before the fully-composed mail is handed
 * to the mail provider. The mail providers' own template engines are no longer
 * used. This also allows sending via providers without a template engine (e.g.
 * a future SMTP provider).
 */

export interface MailTemplateContent {
  subject: string;
  htmlContent: string;
  textContent?: string | null;
}

export interface ComposedMail {
  subject: string;
  messageHtml: string;
  message?: string;
}

/**
 * Flatten a (possibly nested) data object into flat, underscore-separated keys.
 * e.g. `{user: {firstName: 'Jane'}}` becomes `{user_firstName: 'Jane'}`.
 * This keeps the placeholder names identical to the previously
 * provider-flattened ones (e.g. `optional_subscription_memberPlan_name`).
 */
export function flattenMailData<T>(ob: T): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const i in ob) {
    const value = ob[i];

    if (Array.isArray(value)) {
      for (const j in value) {
        if (value[j] && typeof value[j] === 'object') {
          const nested = flattenMailData(value[j]);

          for (const k in nested) {
            flattened[`${i}_${j}_${k}`] = nested[k];
          }
        } else {
          flattened[`${i}_${j}`] = value[j];
        }
      }
    } else if (value && typeof value === 'object') {
      const nested = flattenMailData(value);

      for (const j in nested) {
        flattened[`${i}_${j}`] = nested[j];
      }
    } else {
      flattened[i] = value;
    }
  }

  return flattened;
}

const PLACEHOLDER_REGEX = /{{\s*([\w.]+)\s*}}/g;

/**
 * Replace every `{{ key }}` placeholder in the template with its value from the
 * flattened data. Unknown placeholders are replaced with an empty string.
 */
export function renderTemplate(
  template: string | null | undefined,
  data: Record<string, any>
): string {
  if (!template) {
    return '';
  }

  return template.replace(PLACEHOLDER_REGEX, (_match, key: string) => {
    const value = data[key];

    if (value === undefined || value === null) {
      return '';
    }

    return String(value);
  });
}

/**
 * Compose a fully-rendered mail (subject, html and optional text) from a local
 * template and the mail data.
 */
export function composeMail(
  template: MailTemplateContent,
  data: Record<string, any>
): ComposedMail {
  const flattened = flattenMailData(data);

  return {
    subject: renderTemplate(template.subject, flattened),
    messageHtml: renderTemplate(template.htmlContent, flattened),
    message:
      template.textContent ?
        renderTemplate(template.textContent, flattened)
      : undefined,
  };
}
