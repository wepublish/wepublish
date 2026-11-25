import { PurlData, SAMPLE_PURL_DATA } from '@wepublish/mail/api';

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
  | 'custom'
  | 'customNoSubscription'
  | 'giftCodePurchase'
  | 'giftCodeRedemption';

export const MAIL_TEMPLATE_CONTEXT_IDS: MailTemplateContextId[] = [
  'account',
  'emailChange',
  'subscription',
  'renewal',
  'invoiceCreation',
  'custom',
  'customNoSubscription',
  'giftCodePurchase',
  'giftCodeRedemption',
];

/** Whether a context's data is built from a subscription (vs. user-only). */
export function contextUsesSubscription(id: MailTemplateContextId): boolean {
  return (
    id === 'subscription' ||
    id === 'renewal' ||
    id === 'invoiceCreation' ||
    id === 'custom' ||
    id === 'giftCodeRedemption'
  );
}

export interface MailDataSources {
  user: any;
  subscription?: any;
  invoice?: any;
  /** Only a gift code mail has one; see `giftCodeMailData` in the gift code lib. */
  giftCode?: any;
}

/** Assemble the `{ user, optional, jwt, currentDate }` payload for a context. */
export function assembleMailData(
  contextId: MailTemplateContextId,
  sources: MailDataSources,
  jwt: string,
  purl: PurlData = SAMPLE_PURL_DATA
): {
  user: any;
  optional: Record<string, any>;
  jwt: string;
  currentDate: Date;
} & PurlData {
  const { user, subscription, invoice, giftCode } = sources;
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
    // Free mail to a non-subscriber — there is no subscription to bind.
    case 'customNoSubscription':
      optional = {};
      break;
    // Mirrors `GiftCodeMailService`: the buyer gets the code with the invoice
    // they paid, the redeemer the code with the subscription it paid.
    case 'giftCodePurchase':
      optional = { giftCode, invoice };
      break;
    case 'giftCodeRedemption':
      optional = { giftCode, subscription, invoice };
      break;
  }

  return { user, optional, jwt, currentDate: new Date(), ...purl };
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

// The sample address lives with the letter renderer, which previews need too.
export { SAMPLE_LETTER_ADDRESS } from '@wepublish/letter/api';

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

/** The shape `giftCodeMailData` (gift code lib) hands to a template. */
export const SAMPLE_GIFT_CODE = {
  code: 'ABCD-EFGH-JKMN',
  recipientName: 'Max Muster',
  periodicity: 'yearly',
  redemptionWindowMonths: 12,
  autoRenew: false,
  issuedAt: day('2026-01-12T00:00:00.000Z'),
  expiresAt: day('2027-01-12T00:00:00.000Z'),
  redeemedAt: null,
  offer: { name: 'Jahres-Abo verschenken' },
  memberPlan: { name: 'Jahres-Abo', slug: 'jahres-abo' },
};

export const SAMPLE_REDEEMED_GIFT_CODE = {
  ...SAMPLE_GIFT_CODE,
  redeemedAt: day('2026-02-01T00:00:00.000Z'),
};

/** The standalone invoice a buyer pays for a gift code. */
export const SAMPLE_GIFT_CODE_INVOICE = {
  id: 'ckinv000gift0004',
  mail: 'jane.doe@example.com',
  description: 'Jahres-Abo verschenken',
  currency: 'CHF',
  dueAt: day('2026-01-12T00:00:00.000Z'),
  paidAt: day('2026-01-12T00:00:00.000Z'),
  items: [
    {
      name: 'Jahres-Abo verschenken',
      description: 'Jahres-Abo (yearly)',
      amount: 12000,
      quantity: 1,
    },
  ],
};

/**
 * The sample gift code (and, for a purchase, its invoice) a context's preview
 * shows. The editor has no gift code to choose, so it stands in next to a real
 * subscription too.
 */
export const SAMPLE_GIFT_CODES: Partial<
  Record<MailTemplateContextId, Pick<MailDataSources, 'giftCode' | 'invoice'>>
> = {
  giftCodePurchase: {
    giftCode: SAMPLE_GIFT_CODE,
    invoice: SAMPLE_GIFT_CODE_INVOICE,
  },
  giftCodeRedemption: { giftCode: SAMPLE_REDEEMED_GIFT_CODE },
};

/** Sample payload for a context, used when no subscription is chosen. */
export function assembleSampleMailData(contextId: MailTemplateContextId) {
  return assembleMailData(
    contextId,
    {
      user: SAMPLE_USER,
      subscription: SAMPLE_SUBSCRIPTION,
      invoice: SAMPLE_INVOICE,
      ...SAMPLE_GIFT_CODES[contextId],
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
  jwt: string,
  purl: PurlData = SAMPLE_PURL_DATA
): { user: any; optional: Record<string, any>; jwt: string } & PurlData {
  const { user, subscription, invoice } = sources;

  return {
    user,
    jwt,
    ...purl,
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
