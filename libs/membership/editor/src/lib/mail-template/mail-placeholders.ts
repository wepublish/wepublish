/**
 * Placeholders that can be inserted into a mail template. They are replaced
 * locally (see the API `mail-renderer`) using the `{{key}}` notation before the
 * mail is sent.
 *
 * The data handed to a template is `{ user, optional, jwt }`, flattened with
 * underscores (e.g. `user.firstName` -> `user_firstName`,
 * `optional.subscription.monthlyAmount` -> `optional_subscription_monthlyAmount`).
 * Dates are rendered as ISO strings; booleans as `true`/`false`; numbers as-is.
 *
 * IMPORTANT: `user_*` and `jwt` are ALWAYS available. The `optional_*` keys
 * depend on which event sends the mail — and the available keys (and even their
 * prefix) differ per event, because each event loads different data. The
 * contexts below mirror what actually resolves for each mail; picking one in
 * the editor only shows the keys that work for that mail.
 *
 * `example` shows how the replaced value looks in the final mail.
 */
export interface MailPlaceholder {
  key: string;
  /** Readable default name; can be overridden via i18n `mailTemplates.placeholderNames.<key>`. */
  label: string;
  description: string;
  example: string;
  /**
   * Renders format-variant buttons instead of a single insert button:
   * - 'date': `<key>_date`, `<key>_dateLong`, `<key>_weekday`, `<key>_time`, …
   * - 'money': `<key>` (Rappen), `<key>_chf`, `<key>_display` (with currency).
   */
  kind?: 'date' | 'money';
}

export interface MailPlaceholderContext {
  /** Stable id used by the context picker. */
  id: string;
  /** i18n key for the title. */
  titleKey: string;
  /** Readable default title (fallback when no translation exists). */
  title: string;
  /** Optional hint shown under the title. */
  note?: string;
  placeholders: MailPlaceholder[];
}

/** Always available, regardless of the mail. */
export const ALWAYS_PLACEHOLDERS: MailPlaceholder[] = [
  {
    key: 'user_fullName',
    label: 'Full name',
    description: 'Vor- und Nachname zusammen (z.B. für die Anrede).',
    example: 'Jane Doe',
  },
  {
    key: 'user_firstName',
    label: 'First name',
    description: 'Vorname des Empfängers.',
    example: 'Jane',
  },
  {
    key: 'user_name',
    label: 'Last name',
    description: 'Nachname des Empfängers.',
    example: 'Doe',
  },
  {
    key: 'user_email',
    label: 'Email',
    description: 'E-Mail-Adresse des Empfängers.',
    example: 'jane.doe@example.com',
  },
  {
    key: 'user_flair',
    label: 'Flair',
    description: 'Funktion / Flair des Users.',
    example: 'Vorstandsmitglied',
  },
  {
    key: 'user_birthday',
    label: 'Birthday',
    description: 'Geburtstag. Wähle ein Format.',
    example: '14.05.1990',
    kind: 'date',
  },
  {
    key: 'user_id',
    label: 'User ID',
    description: 'Eindeutige ID des Users.',
    example: 'ckpqr5abc0001',
  },
  {
    key: 'user_active',
    label: 'Active',
    description: 'Ob das Konto aktiv ist (true/false).',
    example: 'true',
  },
  {
    key: 'user_lastLogin',
    label: 'Last login',
    description: 'Letzter Login. Wähle ein Format.',
    example: '30.06.2026',
    kind: 'date',
  },
  {
    key: 'user_createdAt',
    label: 'Account created',
    description:
      'Datum der Konto-Registrierung des Empfängers. Wähle ein Format.',
    example: '01.03.2025',
    kind: 'date',
  },
  {
    key: 'jwt',
    label: 'Login token (JWT)',
    description:
      'Login-Token. An eine Frontend-URL anhängen, z.B. ?jwt={{jwt}}. Bei Passwort-Reset-Mails ist dies das Reset-Token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
  },
];

const SUBSCRIPTION_SCALARS: MailPlaceholder[] = [
  {
    key: 'optional_subscription_id',
    label: 'Subscription ID',
    description: 'Eindeutige ID des Abos.',
    example: 'cklmn456def0002',
  },
  {
    key: 'optional_subscription_monthlyAmount',
    label: 'Monthly amount',
    description: 'Monatlicher Betrag. Wähle ein Format.',
    example: 'CHF 10.00',
    kind: 'money',
  },
  {
    key: 'optional_subscription_periodAmount',
    label: 'Amount per period',
    description:
      'Betrag für die ganze Zahlungsperiode (Monatsbetrag × Monate der Periode). Wähle ein Format.',
    example: 'CHF 120.00',
    kind: 'money',
  },
  {
    key: 'optional_subscription_periodMonths',
    label: 'Months per period',
    description: 'Anzahl Monate der Zahlungsperiode (yearly = 12).',
    example: '12',
  },
  {
    key: 'optional_subscription_currency',
    label: 'Currency',
    description: 'Währung des Abos.',
    example: 'CHF',
  },
  {
    key: 'optional_subscription_paymentPeriodicity',
    label: 'Payment periodicity (raw)',
    description:
      'Zahlungsperiode (Rohwert): yearly, biannual, quarterly, monthly, biennial, lifetime.',
    example: 'monthly',
  },
  {
    key: 'optional_subscription_paymentPeriodicity_display',
    label: 'Payment periodicity (text)',
    description: 'Zahlungsperiode als Text (monatlich, jährlich …).',
    example: 'jährlich',
  },
  {
    key: 'optional_subscription_autoRenew',
    label: 'Auto renewal',
    description: 'Ob das Abo automatisch verlängert wird (true/false).',
    example: 'true',
  },
  {
    key: 'optional_subscription_startsAt',
    label: 'Starts at',
    description: 'Startzeitpunkt des Abos. Wähle ein Format.',
    example: '01.01.2026',
    kind: 'date',
  },
  {
    key: 'optional_subscription_paidUntil',
    label: 'Paid until',
    description: 'Bezahlt bis. Wähle ein Format.',
    example: '31.12.2026',
    kind: 'date',
  },
];

const INVOICE_SCALARS: MailPlaceholder[] = [
  {
    key: 'optional_invoice_id',
    label: 'Invoice ID',
    description: 'Eindeutige ID der Rechnung.',
    example: 'ckinv789ghi0003',
  },
  {
    key: 'optional_invoice_description',
    label: 'Invoice description',
    description: 'Beschreibung der Rechnung.',
    example: 'Mitgliedschaft 2026',
  },
  {
    key: 'optional_invoice_mail',
    label: 'Invoice email',
    description: 'Rechnungs-E-Mail-Adresse.',
    example: 'jane.doe@example.com',
  },
  {
    key: 'optional_invoice_currency',
    label: 'Invoice currency',
    description: 'Währung der Rechnung.',
    example: 'CHF',
  },
  {
    key: 'optional_invoice_dueAt',
    label: 'Invoice due at',
    description: 'Fälligkeitsdatum der Rechnung. Wähle ein Format.',
    example: '15.01.2026',
    kind: 'date',
  },
  {
    key: 'optional_invoice_paidAt',
    label: 'Invoice paid at',
    description: 'Zahlungsdatum der Rechnung. Wähle ein Format.',
    example: '12.01.2026',
    kind: 'date',
  },
  {
    key: 'optional_invoice_total',
    label: 'Invoice total',
    description: 'Summe aller Rechnungspositionen. Wähle ein Format.',
    example: 'CHF 150.00',
    kind: 'money',
  },
];

export const MAIL_PLACEHOLDER_CONTEXTS: MailPlaceholderContext[] = [
  {
    id: 'account',
    titleKey: 'mailTemplates.placeholderContexts.account',
    title: 'Account & login (creation, login link, password reset)',
    note: 'Nur Benutzer-Felder verfügbar.',
    placeholders: [],
  },
  {
    id: 'emailChange',
    titleKey: 'mailTemplates.placeholderContexts.emailChange',
    title: 'Email change',
    placeholders: [
      {
        key: 'optional_newEmail',
        label: 'New email address',
        description: 'Die neue E-Mail-Adresse, auf die gewechselt wird.',
        example: 'new.address@example.com',
      },
    ],
  },
  {
    id: 'subscription',
    titleKey: 'mailTemplates.placeholderContexts.subscription',
    title: 'Subscription (new, confirmed, deactivation)',
    note: 'Abo-Stammdaten. Plan- und Zahlungsmethoden-Namen sind hier NICHT verfügbar – nur in Verlängerungs-Mails.',
    placeholders: [
      ...SUBSCRIPTION_SCALARS,
      {
        key: 'optional_subscription_deactivation_reason',
        label: 'Deactivation reason',
        description:
          'Nur bei Deaktivierung durch den User: none, userSelfDeactivated, invoiceNotPaid, userReplacedSubscription.',
        example: 'invoiceNotPaid',
      },
    ],
  },
  {
    id: 'renewal',
    titleKey: 'mailTemplates.placeholderContexts.renewal',
    title: 'Renewal — automated (success / failed)',
    note: 'Enthält zusätzlich Plan-/Zahlungsmethoden-Namen und Rechnungsdaten.',
    placeholders: [
      ...SUBSCRIPTION_SCALARS,
      {
        key: 'optional_subscription_memberPlan_name',
        label: 'Membership plan name',
        description: 'Name des Abo-Plans, z.B. Jahres-Abo.',
        example: 'Jahres-Abo',
      },
      {
        key: 'optional_subscription_paymentMethod_name',
        label: 'Payment method name',
        description: 'Name der Zahlungsmethode, z.B. Stripe.',
        example: 'Stripe',
      },
      ...INVOICE_SCALARS,
      {
        key: 'optional_items_0_name',
        label: 'Invoice item 1 — name',
        description: 'Name der ersten Rechnungsposition (Array, Index 0).',
        example: 'Jahresmitgliedschaft',
      },
      {
        key: 'optional_items_0_amount',
        label: 'Invoice item 1 — amount (Rappen)',
        description: 'Betrag der ersten Rechnungsposition in Rappen.',
        example: '12000',
      },
      {
        key: 'optional_errorCode',
        label: 'Payment error code',
        description: 'Nur bei fehlgeschlagener Zahlung gesetzt.',
        example: 'card_declined',
      },
    ],
  },
  {
    id: 'invoiceCreation',
    titleKey: 'mailTemplates.placeholderContexts.invoiceCreation',
    title: 'Invoice created',
    note: 'Achtung: Abo-Felder hier unter dem Präfix optional_subscriptionToCreateInvoice_*.',
    placeholders: [
      {
        key: 'optional_subscriptionToCreateInvoice_id',
        label: 'Subscription ID',
        description: 'ID des Abos, für das die Rechnung erstellt wird.',
        example: 'cklmn456def0002',
      },
      {
        key: 'optional_subscriptionToCreateInvoice_monthlyAmount',
        label: 'Monthly amount',
        description: 'Monatlicher Betrag. Wähle ein Format.',
        example: 'CHF 10.00',
        kind: 'money',
      },
      {
        key: 'optional_subscriptionToCreateInvoice_periodAmount',
        label: 'Amount per period',
        description: 'Betrag für die ganze Zahlungsperiode. Wähle ein Format.',
        example: 'CHF 120.00',
        kind: 'money',
      },
      {
        key: 'optional_subscriptionToCreateInvoice_memberPlan_name',
        label: 'Membership plan name',
        description: 'Name des Abo-Plans.',
        example: 'Jahres-Abo',
      },
      ...INVOICE_SCALARS,
      {
        key: 'optional_invoice_items_0_name',
        label: 'Invoice item 1 — name',
        description: 'Name der ersten Rechnungsposition (Array, Index 0).',
        example: 'Jahresmitgliedschaft',
      },
      {
        key: 'optional_invoice_items_0_amount',
        label: 'Invoice item 1 — amount (Rappen)',
        description: 'Betrag der ersten Rechnungsposition in Rappen.',
        example: '12000',
      },
    ],
  },
  {
    id: 'custom',
    titleKey: 'mailTemplates.placeholderContexts.custom',
    title: 'Custom mail to a subscriber (subscription + invoices)',
    note: 'Rechnungen kommen als Array: optional_invoices_0_* (neueste zuerst).',
    placeholders: [
      ...SUBSCRIPTION_SCALARS,
      {
        key: 'optional_invoices_0_id',
        label: 'Latest invoice — ID',
        description: 'ID der neuesten Rechnung (Array, Index 0).',
        example: 'ckinv789ghi0003',
      },
      {
        key: 'optional_invoices_0_description',
        label: 'Latest invoice — description',
        description: 'Beschreibung der neuesten Rechnung.',
        example: 'Mitgliedschaft 2026',
      },
    ],
  },
];

/** Short, human-readable label per mail type (for lists and inline names). */
export const MAIL_TYPE_LABEL_KEYS: Record<string, string> = {
  account: 'mailTemplates.mailTypes.account',
  emailChange: 'mailTemplates.mailTypes.emailChange',
  subscription: 'mailTemplates.mailTypes.subscription',
  renewal: 'mailTemplates.mailTypes.renewal',
  invoiceCreation: 'mailTemplates.mailTypes.invoiceCreation',
  custom: 'mailTemplates.mailTypes.custom',
};

/** Resolve a mail type to its short label, or `null` when no type is set. */
export const mailTypeLabel = (
  context: string | null | undefined,
  translate: (key: string, fallback: string) => string
): string | null =>
  context ? translate(MAIL_TYPE_LABEL_KEYS[context] ?? context, context) : null;

/** `Name (Type)` for use wherever a template is referenced; bare name if unset. */
export const formatTemplateLabel = (
  name: string,
  context: string | null | undefined,
  translate: (key: string, fallback: string) => string
): string => {
  const label = mailTypeLabel(context, translate);
  return label ? `${name} (${label})` : name;
};
