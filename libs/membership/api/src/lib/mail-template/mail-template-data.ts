/**
 * Builds the `{ user, optional, jwt }` payload that a transactional mail of a
 * given "mail type" (context) receives. Used for the editor preview and test
 * send. The shapes here mirror what the real send paths pass as `optionalData`
 * per event (see member-context / periodic-job), so previews match production.
 */

export type MailTemplateContextId =
  | 'account'
  | 'emailChange'
  | 'subscription'
  | 'renewal'
  | 'invoiceCreation'
  | 'custom';

export const MAIL_TEMPLATE_CONTEXT_IDS: MailTemplateContextId[] = [
  'account',
  'emailChange',
  'subscription',
  'renewal',
  'invoiceCreation',
  'custom',
];

/** Whether a context's data is built from a subscription (vs. user-only). */
export function contextUsesSubscription(id: MailTemplateContextId): boolean {
  return (
    id === 'subscription' ||
    id === 'renewal' ||
    id === 'invoiceCreation' ||
    id === 'custom'
  );
}

export interface MailDataSources {
  user: any;
  subscription?: any;
  invoice?: any;
}

/** Assemble the `{ user, optional, jwt }` payload for a context. */
export function assembleMailData(
  contextId: MailTemplateContextId,
  sources: MailDataSources,
  jwt: string
): { user: any; optional: Record<string, any>; jwt: string } {
  const { user, subscription, invoice } = sources;
  const items = invoice?.items ?? [];

  let optional: Record<string, any> = {};

  switch (contextId) {
    case 'account':
      optional = {};
      break;
    case 'emailChange':
      optional = { newEmail: 'new.address@example.com' };
      break;
    case 'subscription':
      optional = { subscription };
      break;
    case 'renewal':
      optional = { subscription, invoice, items, errorCode: '' };
      break;
    case 'invoiceCreation':
      optional = { subscriptionToCreateInvoice: subscription, invoice };
      break;
    case 'custom':
      optional = { subscription, invoices: invoice ? [invoice] : [] };
      break;
  }

  return { user, optional, jwt };
}

const day = (iso: string) => new Date(iso);

export const SAMPLE_USER = {
  id: 'ckpqr5abc0001',
  email: 'jane.doe@example.com',
  firstName: 'Jane',
  name: 'Doe',
  flair: 'Vorstandsmitglied',
  birthday: day('1990-05-14T00:00:00.000Z'),
  active: true,
  lastLogin: day('2026-06-30T08:22:10.000Z'),
  createdAt: day('2025-03-01T12:00:00.000Z'),
};

export const SAMPLE_SUBSCRIPTION = {
  id: 'cklmn456def0002',
  monthlyAmount: 1000,
  currency: 'CHF',
  paymentPeriodicity: 'yearly',
  autoRenew: true,
  extendable: true,
  confirmed: true,
  startsAt: day('2026-01-01T00:00:00.000Z'),
  paidUntil: day('2026-12-31T00:00:00.000Z'),
  memberPlanID: 'ckmp000plan0001',
  paymentMethodID: 'ckpm000meth0001',
  memberPlan: { name: 'Jahres-Abo', slug: 'jahres-abo' },
  paymentMethod: { name: 'Stripe', slug: 'stripe' },
  deactivation: {
    id: 'ckdeact000001',
    reason: 'invoiceNotPaid',
    date: day('2026-03-01T00:00:00.000Z'),
  },
  periods: [
    {
      id: 'ckper000001',
      amount: 12000,
      paymentPeriodicity: 'yearly',
      startsAt: day('2026-01-01T00:00:00.000Z'),
      endsAt: day('2026-12-31T00:00:00.000Z'),
    },
  ],
};

export const SAMPLE_INVOICE = {
  id: 'ckinv789ghi0003',
  mail: 'jane.doe@example.com',
  description: 'Mitgliedschaft 2026',
  currency: 'CHF',
  dueAt: day('2026-01-15T00:00:00.000Z'),
  paidAt: day('2026-01-12T00:00:00.000Z'),
  scheduledDeactivationAt: day('2026-02-15T00:00:00.000Z'),
  items: [{ name: 'Jahresmitgliedschaft', amount: 12000, quantity: 1 }],
};

export const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample.token';

/** Sample payload for a context, used when no subscription is chosen. */
export function assembleSampleMailData(contextId: MailTemplateContextId) {
  return assembleMailData(
    contextId,
    {
      user: SAMPLE_USER,
      subscription: SAMPLE_SUBSCRIPTION,
      invoice: SAMPLE_INVOICE,
    },
    SAMPLE_JWT
  );
}

/**
 * A "kitchen sink" payload that populates EVERY optional field at once,
 * regardless of which event would really carry it. Used for the editor
 * preview/test so authors can verify all placeholders render, even in a
 * template that mixes fields from different mails.
 */
export function assembleFullMailData(
  sources: MailDataSources,
  jwt: string
): { user: any; optional: Record<string, any>; jwt: string } {
  const { user, subscription, invoice } = sources;

  return {
    user,
    jwt,
    optional: {
      newEmail: 'new.address@example.com',
      subscription,
      subscriptionToCreateInvoice: subscription,
      invoice,
      invoices: invoice ? [invoice] : [],
      items: invoice?.items ?? [],
      subscriptionPeriods: subscription?.periods ?? [],
      errorCode: 'card_declined',
      paymentProviderID: 'stripe',
    },
  };
}

export function assembleFullSampleMailData(jwt: string = SAMPLE_JWT) {
  return assembleFullMailData(
    {
      user: SAMPLE_USER,
      subscription: SAMPLE_SUBSCRIPTION,
      invoice: SAMPLE_INVOICE,
    },
    jwt
  );
}
