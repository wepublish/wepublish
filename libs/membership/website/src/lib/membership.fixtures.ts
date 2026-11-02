import {
  FullInvoiceFragment,
  FullSubscriptionFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';

// Complete fragments for specs: a missing field leaves the entry incomplete in
// the Apollo cache, and the query then refetches from used-up mocks. Specs pass
// the member plan and payment method (e.g. from @wepublish/mocks/website).

export const subscriptionFixture = (
  {
    memberPlan,
    paymentMethod,
  }: Pick<FullSubscriptionFragment, 'memberPlan' | 'paymentMethod'>,
  overrides: Partial<FullSubscriptionFragment> = {}
): FullSubscriptionFragment =>
  ({
    __typename: 'PublicSubscription',
    id: 'subscription-1',
    isActive: true,
    startsAt: '2024-01-01T00:00:00.000Z',
    paidUntil: '2032-01-01T00:00:00.000Z',
    autoRenew: true,
    monthlyAmount: 1000,
    paymentPeriodicity: PaymentPeriodicity.Yearly,
    url: 'https://example.com/profile/subscription/subscription-1',
    paymentMethod,
    memberPlan,
    properties: [],
    deactivation: null,
    extendable: true,
    canExtend: false,
    canRevertUpgrade: false,
    goodie: null,
    externalReward: null,
    pendingPaymentMethodChange: null,
    canRenewPaymentMethod: false,
    ...overrides,
  }) satisfies FullSubscriptionFragment;

export const invoiceFixture = (
  subscription: FullSubscriptionFragment,
  overrides: Partial<FullInvoiceFragment> = {}
): FullInvoiceFragment =>
  ({
    __typename: 'Invoice',
    id: 'invoice-1',
    createdAt: '2025-12-01T00:00:00.000Z',
    modifiedAt: '2025-12-01T00:00:00.000Z',
    dueAt: '2026-01-01T00:00:00.000Z',
    subscription,
    subscriptionID: subscription.id,
    items: [],
    mail: 'reader@example.com',
    total: 12000,
    description: 'Jahresabo 2026',
    canceledAt: null,
    paidAt: null,
    ...overrides,
  }) satisfies FullInvoiceFragment;
