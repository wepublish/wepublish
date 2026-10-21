import {
  Currency,
  FullAvailablePaymentMethodFragment,
  FullGoodieFragment,
  FullInvoiceFragment,
  FullInvoiceItemFragment,
  FullMemberPlanFragment,
  FullPaymentFragment,
  FullPaymentMethodFragment,
  FullSubscriptionDeactivationFragment,
  FullSubscriptionFragment,
  PaymentPeriodicity,
  PaymentState,
  ProductType,
  SubscriptionDeactivationReason,
  CreateSubscriptionInfoQuery,
  UpgradeSubscriptionInfoQuery,
} from '@wepublish/website/api';
import { mockImage } from './image';
import { mockRichText, mockShortRichText } from './richtext';
import { faker, MOCK_FAR_FUTURE_DATE, MOCK_REFERENCE_DATE } from './faker';
import { definedOnly } from './overrides';

type PeriodicityPrice = FullMemberPlanFragment['periodicityPricing'][number];
type MemberPlanPage = NonNullable<FullMemberPlanFragment['successPage']>;

export const mockPaymentMethod = ({
  image = mockImage(),
  ...overrides
}: Partial<FullPaymentMethodFragment> = {}): FullPaymentMethodFragment => {
  const name = overrides.name ?? faker.commerce.productName();

  return {
    __typename: 'PaymentMethod',
    id: faker.string.nanoid(),
    name,
    slug: name,
    description: faker.company.name(),
    paymentProviderID: faker.string.nanoid(),
    gracePeriod: 0,
    image,
    ...definedOnly(overrides),
  };
};

export const mockAvailablePaymentMethod = ({
  paymentMethods = [mockPaymentMethod(), mockPaymentMethod()],
  ...overrides
}: Partial<FullAvailablePaymentMethodFragment> = {}): FullAvailablePaymentMethodFragment => ({
  __typename: 'AvailablePaymentMethod',
  forceAutoRenewal: false,
  paymentPeriodicities: [
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Lifetime,
  ],
  paymentMethods,
  ...definedOnly(overrides),
});

export const mockGoodie = ({
  description = mockShortRichText(),
  image = mockImage(),
  ...overrides
}: Partial<FullGoodieFragment> = {}): FullGoodieFragment => ({
  __typename: 'Goodie',
  id: faker.string.nanoid(),
  name: faker.commerce.productName(),
  stock: 10,
  description,
  image,
  ...definedOnly(overrides),
});

export const mockPeriodicityPrice = (
  overrides: Partial<PeriodicityPrice> = {}
): PeriodicityPrice => ({
  __typename: 'PeriodicityPrice',
  periodicity: PaymentPeriodicity.Monthly,
  label: null,
  amountMin: 500,
  amountTarget: 700,
  amountMax: 1000,
  ...definedOnly(overrides),
});

const mockMemberPlanPage = (url: string): MemberPlanPage => ({
  __typename: 'Page',
  url,
});

export const mockMemberPlan = ({
  image = mockImage(),
  availablePaymentMethods = [
    mockAvailablePaymentMethod(),
    mockAvailablePaymentMethod(),
  ],
  description = mockRichText(),
  shortDescription = mockShortRichText(),
  periodicityPricing = [mockPeriodicityPrice()],
  ...overrides
}: Partial<FullMemberPlanFragment> = {}): FullMemberPlanFragment => {
  const name = overrides.name ?? faker.commerce.productName();

  return {
    __typename: 'MemberPlan',
    id: faker.string.nanoid(),
    name,
    slug: name,
    currency: Currency.Chf,
    tags: ['foo', 'bar'],
    extendable: true,
    productType: ProductType.Subscription,
    successPageId: faker.string.nanoid(),
    failPageId: faker.string.nanoid(),
    confirmationPageId: faker.string.nanoid(),
    successPage: mockMemberPlanPage('https://example.com/success'),
    failPage: mockMemberPlanPage('https://example.com/fail'),
    confirmationPage: mockMemberPlanPage('https://example.com/confirmation'),
    goodies: [],
    defaultPaymentPeriodicity: null,
    image,
    availablePaymentMethods,
    description,
    shortDescription,
    periodicityPricing,
    ...definedOnly(overrides),
  };
};

export const mockSubscriptionDeactivation = (
  overrides: Partial<FullSubscriptionDeactivationFragment> = {}
): FullSubscriptionDeactivationFragment => ({
  __typename: 'SubscriptionDeactivation',
  date: MOCK_REFERENCE_DATE,
  reason: SubscriptionDeactivationReason.UserSelfDeactivated,
  ...definedOnly(overrides),
});

export const mockSubscription = ({
  memberPlan = mockMemberPlan(),
  paymentMethod = memberPlan.availablePaymentMethods[0]?.paymentMethods[0] ??
    mockPaymentMethod(),
  monthlyAmount = memberPlan.periodicityPricing.find(
    price => price.periodicity === PaymentPeriodicity.Monthly
  )?.amountMin ?? 500,
  paymentPeriodicity = memberPlan.availablePaymentMethods[0]
    ?.paymentPeriodicities[0] ?? PaymentPeriodicity.Monthly,
  ...overrides
}: Partial<FullSubscriptionFragment> = {}): FullSubscriptionFragment => ({
  __typename: 'PublicSubscription',
  id: faker.string.nanoid(),
  url: faker.internet.url(),
  autoRenew: true,
  extendable: true,
  isActive: true,
  canExtend: false,
  canRevertUpgrade: false,
  startsAt: MOCK_REFERENCE_DATE,
  paidUntil: MOCK_FAR_FUTURE_DATE,
  externalReward: null,
  deactivation: null,
  goodie: null,
  properties: [],
  memberPlan,
  paymentMethod,
  monthlyAmount,
  paymentPeriodicity,
  ...definedOnly(overrides),
});

export const mockInvoiceItem = ({
  amount = 500,
  createdAt = MOCK_REFERENCE_DATE,
  ...overrides
}: Partial<FullInvoiceItemFragment> = {}): FullInvoiceItemFragment => ({
  __typename: 'InvoiceItem',
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  quantity: 1,
  amount,
  total: amount,
  createdAt,
  modifiedAt: createdAt,
  ...definedOnly(overrides),
});

export const mockInvoice = ({
  subscription = mockSubscription(),
  createdAt = MOCK_REFERENCE_DATE,
  total = subscription?.monthlyAmount ?? 500,
  items = [mockInvoiceItem({ amount: total, createdAt })],
  ...overrides
}: Partial<FullInvoiceFragment> = {}): FullInvoiceFragment => ({
  __typename: 'Invoice',
  id: faker.string.nanoid(),
  mail: faker.internet.email(),
  description: faker.lorem.sentence(),
  dueAt: MOCK_REFERENCE_DATE,
  paidAt: MOCK_REFERENCE_DATE,
  canceledAt: null,
  modifiedAt: createdAt,
  subscriptionID: subscription?.id ?? null,
  createdAt,
  subscription,
  total,
  items,
  ...definedOnly(overrides),
});

export const mockPayment = ({
  paymentMethod = mockPaymentMethod(),
  ...overrides
}: Partial<FullPaymentFragment> = {}): FullPaymentFragment => ({
  __typename: 'Payment',
  id: faker.string.nanoid(),
  intentSecret: faker.string.nanoid(),
  state: PaymentState.Created,
  paymentMethod,
  ...definedOnly(overrides),
});

export const mockCreateSubscriptionInfo = (
  overrides: Partial<CreateSubscriptionInfoQuery['createSubscriptionInfo']> = {}
): CreateSubscriptionInfoQuery['createSubscriptionInfo'] => ({
  __typename: 'CreateSubscriptionInfo',
  discountCodeValid: null,
  discountPercent: null,
  ...definedOnly(overrides),
});

export const mockUpgradeSubscriptionInfo = (
  overrides: Partial<
    UpgradeSubscriptionInfoQuery['upgradeUserSubscriptionInfo']
  > = {}
): UpgradeSubscriptionInfoQuery['upgradeUserSubscriptionInfo'] => ({
  __typename: 'UpgradeSubscription',
  discountAmount: 0,
  discountCodeValid: null,
  discountPercent: null,
  ...definedOnly(overrides),
});
