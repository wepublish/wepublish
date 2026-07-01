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
/**
 * Sensitive fields that must never end up in a rendered mail, even when a
 * nested object (e.g. `optional.subscription.user`) carries them. The top-level
 * recipient is already stripped in the controller, but nested objects are not,
 * so we drop these defensively wherever they appear.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'totpSecret',
  'totpEnabled',
  'totpExempt',
  'roleIDs',
]);

export function flattenMailData<T>(ob: T): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const i in ob) {
    if (SENSITIVE_KEYS.has(i)) {
      continue;
    }

    const value = ob[i];

    if (value instanceof Date) {
      // Dates have no enumerable keys, so recursing into them would silently
      // drop the value. Serialize to an ISO string instead (matching how the
      // user object is serialized before reaching here).
      flattened[i] = value.toISOString();
    } else if (Array.isArray(value)) {
      for (const j in value) {
        const element = value[j];

        if (element instanceof Date) {
          flattened[`${i}_${j}`] = element.toISOString();
        } else if (element && typeof element === 'object') {
          const nested = flattenMailData(element);

          for (const k in nested) {
            flattened[`${i}_${j}_${k}`] = nested[k];
          }
        } else {
          flattened[`${i}_${j}`] = element;
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
 * Mandrill (Mailchimp Transactional) merge tags use the `*|NAME|*` syntax, not
 * our `{{ name }}` syntax. The historically pushed merge-var names already match
 * our flattened keys (underscore separated, e.g. `user_firstName`).
 */
const MANDRILL_PLACEHOLDER_REGEX = /\*\|\s*([\w.]+)\s*\|\*/g;

/**
 * Rewrite Mandrill `*|NAME|*` merge tags to our `{{ name }}` syntax so imported
 * provider templates render with the local engine. Mandrill block/special tags
 * (e.g. `*|MC:EDIT|*`, `*|IF:...|*`) contain characters outside `[\w.]` and are
 * intentionally left untouched. Case is preserved; resolution is
 * case-insensitive so uppercase author tags still match camelCase keys.
 */
export function convertMandrillPlaceholders(
  content: string | null | undefined
): string {
  if (!content) {
    return '';
  }

  return content.replace(
    MANDRILL_PLACEHOLDER_REGEX,
    (_match, key: string) => `{{${key}}}`
  );
}

/**
 * Replace every `{{ key }}` placeholder in the template with its value from the
 * flattened data. Unknown placeholders are replaced with an empty string.
 * Lookups are case-insensitive so uppercase tags from imported Mandrill
 * templates (e.g. `{{USER_FIRSTNAME}}`) still resolve to camelCase keys.
 */
export function renderTemplate(
  template: string | null | undefined,
  data: Record<string, any>
): string {
  if (!template) {
    return '';
  }

  const lowerLookup: Record<string, any> = {};
  for (const dataKey of Object.keys(data)) {
    lowerLookup[dataKey.toLowerCase()] = data[dataKey];
  }

  return template.replace(PLACEHOLDER_REGEX, (_match, key: string) => {
    const value = key in data ? data[key] : lowerLookup[key.toLowerCase()];

    if (value === undefined || value === null) {
      return '';
    }

    return String(value);
  });
}

/**
 * Locale and timezone used for derived, human-friendly formats. Hardcoded to
 * Swiss German for now; could become a per-tenant setting later.
 */
const LOCALE = 'de-CH';
const FALLBACK_TIME_ZONE = 'Europe/Zurich';

/**
 * Timezone for derived date formats. Taken from the standard `TZ` env var,
 * falling back to Europe/Zurich. Invalid values fall back too.
 */
function resolveTimeZone(): string {
  const tz = process.env.TZ?.trim();

  if (!tz) {
    return FALLBACK_TIME_ZONE;
  }

  try {
    // Throws RangeError on an unknown timezone.
    new Intl.DateTimeFormat(LOCALE, { timeZone: tz });
    return tz;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

/** Matches the ISO strings produced by the flattener (`Date.toISOString()`). */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** Number of months a payment period spans. Mirrors `mapPaymentPeriodToMonths`. */
const MONTHS_BY_PERIODICITY: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  yearly: 12,
  biennial: 24,
  lifetime: 1200,
};

/** Human-readable (German) labels for payment periodicities. */
const PERIODICITY_LABELS: Record<string, string> = {
  monthly: 'monatlich',
  quarterly: 'vierteljährlich',
  biannual: 'halbjährlich',
  yearly: 'jährlich',
  biennial: 'alle zwei Jahre',
  lifetime: 'einmalig',
};

function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions,
  locale: string = LOCALE
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: resolveTimeZone(),
    ...options,
  }).format(new Date(iso));
}

/** Format an amount given in Rappen (cents) as a decimal string, e.g. 1000 -> "10.00". */
function formatRappenAsDecimal(rappen: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rappen / 100);
}

/**
 * For every flattened value that is an ISO date string, add human-friendly
 * format variants: `<key>_date`, `<key>_dateLong`, `<key>_time`,
 * `<key>_dateTime`. So `{{user_lastLogin_date}}` -> "30.06.2026".
 */
export function deriveDateFormats(
  flattened: Record<string, any>
): Record<string, string> {
  const derived: Record<string, string> = {};

  for (const [key, value] of Object.entries(flattened)) {
    if (typeof value !== 'string' || !ISO_DATE_REGEX.test(value)) {
      continue;
    }

    derived[`${key}_date`] = formatDate(value, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    // ISO date-only (YYYY-MM-DD) in the configured timezone.
    derived[`${key}_isoDate`] = formatDate(
      value,
      { day: '2-digit', month: '2-digit', year: 'numeric' },
      'en-CA'
    );
    derived[`${key}_dateLong`] = formatDate(value, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    derived[`${key}_weekday`] = formatDate(value, { weekday: 'long' });
    derived[`${key}_time`] = formatDate(value, {
      hour: '2-digit',
      minute: '2-digit',
    });
    derived[`${key}_dateTime`] = formatDate(value, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return derived;
}

function deriveSubscriptionMoney(
  prefix: string,
  subscription: any
): Record<string, string> {
  const derived: Record<string, string> = {};

  if (!subscription || typeof subscription.monthlyAmount !== 'number') {
    return derived;
  }

  const currency = subscription.currency ?? 'CHF';
  const monthly = subscription.monthlyAmount;
  const months = MONTHS_BY_PERIODICITY[subscription.paymentPeriodicity];

  derived[`${prefix}_monthlyAmount_chf`] = formatRappenAsDecimal(monthly);
  derived[`${prefix}_monthlyAmount_display`] =
    `${currency} ${formatRappenAsDecimal(monthly)}`;

  const periodicityLabel = PERIODICITY_LABELS[subscription.paymentPeriodicity];
  if (periodicityLabel) {
    derived[`${prefix}_paymentPeriodicity_display`] = periodicityLabel;
  }

  if (months) {
    const periodTotal = monthly * months;
    derived[`${prefix}_periodMonths`] = String(months);
    derived[`${prefix}_periodAmount`] = String(periodTotal);
    derived[`${prefix}_periodAmount_chf`] = formatRappenAsDecimal(periodTotal);
    derived[`${prefix}_periodAmount_display`] =
      `${currency} ${formatRappenAsDecimal(periodTotal)}`;
  }

  return derived;
}

/**
 * Compute processed/derived placeholders that aren't raw fields: money in CHF
 * and per-period totals, invoice totals, etc. Date formats are handled
 * separately over the flattened data.
 */
export function deriveComputedFields(
  data: Record<string, any>
): Record<string, string> {
  const optional = data?.['optional'] ?? {};
  const user = data?.['user'] ?? {};
  const derived: Record<string, string> = {
    ...deriveSubscriptionMoney(
      'optional_subscription',
      optional['subscription']
    ),
    ...deriveSubscriptionMoney(
      'optional_subscriptionToCreateInvoice',
      optional['subscriptionToCreateInvoice']
    ),
  };

  // Full name (greeting), e.g. "Jane Doe".
  const fullName = [user['firstName'], user['name']].filter(Boolean).join(' ');
  if (fullName) {
    derived['user_fullName'] = fullName;
  }

  // Invoice total from line items (Rappen), wherever the items live.
  const items: any[] | undefined =
    optional['invoice']?.items ?? optional['items'] ?? undefined;

  if (Array.isArray(items) && items.length) {
    const totalRappen = items.reduce(
      (sum, item) => sum + (typeof item?.amount === 'number' ? item.amount : 0),
      0
    );
    const currency =
      optional['invoice']?.currency ??
      optional['subscription']?.currency ??
      'CHF';

    derived['optional_invoice_total'] = String(totalRappen);
    derived['optional_invoice_total_chf'] = formatRappenAsDecimal(totalRappen);
    derived['optional_invoice_total_display'] =
      `${currency} ${formatRappenAsDecimal(totalRappen)}`;
  }

  return derived;
}

/**
 * Compose a fully-rendered mail (subject, html and optional text) from a local
 * template and the mail data. Raw fields, computed fields (money/totals) and
 * date-format variants are all available as `{{key}}` placeholders.
 */
export function composeMail(
  template: MailTemplateContent,
  data: Record<string, any>
): ComposedMail {
  const flattened = flattenMailData(data);
  const enriched = {
    ...flattened,
    ...deriveDateFormats(flattened),
    ...deriveComputedFields(data),
  };

  return {
    subject: renderTemplate(template.subject, enriched),
    messageHtml: renderTemplate(template.htmlContent, enriched),
    message:
      template.textContent ?
        renderTemplate(template.textContent, enriched)
      : undefined,
  };
}
