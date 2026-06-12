import { SubscriptionEvent, UserEvent } from '@prisma/client';

import { flattenObjForMandrill } from '../flatten';

export interface MailPlaceholder {
  key: string;
  example: string;
}

export interface MailPlaceholderGroup {
  event: string;
  placeholders: MailPlaceholder[];
}

const SAMPLE_USER = {
  id: '8a7f0c2e-2b1d-4c3a-9f5e-1d2c3b4a5e6f',
  createdAt: '2024-01-15T10:00:00.000Z',
  modifiedAt: '2024-02-20T14:30:00.000Z',
  email: 'max.muster@example.com',
  emailVerifiedAt: '2024-01-15T10:05:00.000Z',
  name: 'Muster',
  firstName: 'Max',
  flair: 'Redaktion',
  birthday: '1985-06-01T00:00:00.000Z',
  active: true,
  lastLogin: '2024-02-19T09:12:00.000Z',
};

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0';

const SAMPLE_SUBSCRIPTION = {
  id: 'b3c1d2e4-f5a6-4789-90ab-cdef01234567',
  paymentPeriodicity: 'yearly',
  monthlyAmount: 1000,
  autoRenew: true,
  startsAt: '2024-01-15T00:00:00.000Z',
  paidUntil: '2025-01-15T00:00:00.000Z',
  currency: 'CHF',
  extendable: true,
  confirmed: true,
  memberPlan: { name: 'Jahresabo' },
  paymentMethod: { name: 'Kreditkarte' },
};

const SAMPLE_INVOICE = {
  id: 'c4d2e3f5-a6b7-4890-a1bc-def012345678',
  mail: 'max.muster@example.com',
  dueAt: '2025-01-15T00:00:00.000Z',
  description: 'Verlaengerung Jahresabo',
  paidAt: '2025-01-10T08:30:00.000Z',
  currency: 'CHF',
};

const SAMPLE_ITEMS = [
  {
    name: 'Jahresabo',
    description: 'Mitgliedschaft 12 Monate',
    quantity: 1,
    amount: 12000,
  },
];

const SAMPLE_PERIODS = [
  {
    id: 'd5e3f4a6-b7c8-4901-b2cd-ef0123456789',
    startsAt: '2025-01-15T00:00:00.000Z',
    endsAt: '2026-01-15T00:00:00.000Z',
    paymentPeriodicity: 'yearly',
    amount: 12000,
  },
];

const OPTIONAL_DATA_BY_EVENT: Record<string, Record<string, unknown>> = {
  [UserEvent.ACCOUNT_CREATION]: {},
  [UserEvent.PASSWORD_RESET]: {},
  [UserEvent.LOGIN_LINK]: {},
  [UserEvent.TEST_MAIL]: {},
  [UserEvent.EMAIL_CHANGE]: { newEmail: 'neue.adresse@example.com' },

  [SubscriptionEvent.SUBSCRIBE]: { subscription: SAMPLE_SUBSCRIPTION },
  [SubscriptionEvent.CONFIRM_SUBSCRIPTION]: {
    subscription: SAMPLE_SUBSCRIPTION,
  },
  [SubscriptionEvent.DEACTIVATION_BY_USER]: {
    subscription: SAMPLE_SUBSCRIPTION,
  },
  [SubscriptionEvent.INVOICE_CREATION]: {
    subscriptionToCreateInvoice: SAMPLE_SUBSCRIPTION,
    invoice: SAMPLE_INVOICE,
  },
  [SubscriptionEvent.RENEWAL_SUCCESS]: {
    subscription: SAMPLE_SUBSCRIPTION,
    invoice: SAMPLE_INVOICE,
    items: SAMPLE_ITEMS,
    subscriptionPeriods: SAMPLE_PERIODS,
  },
  [SubscriptionEvent.RENEWAL_FAILED]: {
    subscription: SAMPLE_SUBSCRIPTION,
    invoice: SAMPLE_INVOICE,
    items: SAMPLE_ITEMS,
    subscriptionPeriods: SAMPLE_PERIODS,
    errorCode: 'card_declined',
    paymentProviderID: 'stripe',
  },
  [SubscriptionEvent.DEACTIVATION_UNPAID]: {
    subscription: SAMPLE_SUBSCRIPTION,
    invoice: SAMPLE_INVOICE,
  },
  [SubscriptionEvent.CUSTOM]: {
    subscription: SAMPLE_SUBSCRIPTION,
    invoices: [SAMPLE_INVOICE, SAMPLE_INVOICE],
  },
};

const PLACEHOLDER_EVENTS = [
  ...Object.values(SubscriptionEvent),
  ...Object.values(UserEvent),
];

function buildPlaceholdersForEvent(event: string): MailPlaceholder[] {
  const flattened = flattenObjForMandrill({
    user: SAMPLE_USER,
    optional: OPTIONAL_DATA_BY_EVENT[event] ?? {},
    jwt: SAMPLE_JWT,
  });

  return Object.entries(flattened).map(([key, example]) => ({
    key,
    example: String(example),
  }));
}

export function getMailPlaceholderGroups(): MailPlaceholderGroup[] {
  return PLACEHOLDER_EVENTS.map(event => ({
    event,
    placeholders: buildPlaceholdersForEvent(event),
  }));
}
