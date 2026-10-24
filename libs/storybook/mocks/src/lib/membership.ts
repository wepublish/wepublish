import {
  CaptchaType,
  Challenge,
  Currency,
  FullAvailablePaymentMethodFragment,
  FullGiftCodeFragment,
  FullGiftCodeOfferFragment,
  FullGoodieFragment,
  FullInvoiceFragment,
  FullInvoiceItemFragment,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  GiftCodeStatus,
  PaymentPeriodicity,
  ProductType,
  PublicSubscription,
} from '@wepublish/website/api';
import { mockImage } from './image';
import { faker } from '@faker-js/faker';
import { mockTag } from './tag';
import { mockRichText, mockShortRichText } from './richtext';
import { mockUser } from './user';

export const mockPaymentMethod = ({
  id = faker.string.nanoid(),
  name = faker.commerce.productName(),
  slug = name,
  description = faker.company.name(),
  paymentProviderID = faker.string.nanoid(),
  gracePeriod = 0,
  image = mockImage(),
  imageId = image?.id,
}: Partial<FullPaymentMethodFragment> = {}): FullPaymentMethodFragment & {
  active: boolean;
  createdAt: string;
  modifiedAt: string;
} => ({
  __typename: 'PaymentMethod',
  id,
  name,
  slug,
  paymentProviderID,
  description,
  gracePeriod,
  image,
  imageId,
  active: true,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
});

export const mockAvailablePaymentMethod = ({
  forceAutoRenewal = false,
  paymentPeriodicities = [
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Lifetime,
  ],
  paymentMethods = [mockPaymentMethod(), mockPaymentMethod()],
  paymentMethodIDs = [],
}: Partial<
  FullAvailablePaymentMethodFragment & {
    paymentMethodIDs: string[];
  }
> = {}): FullAvailablePaymentMethodFragment & {
  paymentMethodIDs: string[];
} => ({
  __typename: 'AvailablePaymentMethod',
  forceAutoRenewal,
  paymentMethods,
  paymentPeriodicities,
  paymentMethodIDs,
});

export const mockGoodie = ({
  id = faker.string.nanoid(),
  name = faker.commerce.productName(),
  description = mockShortRichText(),
  image = mockImage(),
  stock = 10,
}: Partial<FullGoodieFragment> = {}): FullGoodieFragment => ({
  __typename: 'Goodie',
  id,
  name,
  description,
  image,
  stock,
});

export const mockMemberPlan = ({
  id = faker.string.nanoid(),
  image = mockImage(),
  name = faker.commerce.productName(),
  slug = name,
  currency = Currency.Chf,
  tags = [mockTag().tag!, mockTag().tag!],
  extendable = true,
  productType = ProductType.Subscription,
  availablePaymentMethods = [
    mockAvailablePaymentMethod(),
    mockAvailablePaymentMethod(),
  ],
  description = mockRichText(),
  shortDescription = mockShortRichText(),
  successPageId = faker.string.nanoid(),
  failPageId = faker.string.nanoid(),
  confirmationPageId = faker.string.nanoid(),
  successPage = {
    url: 'https://example.com/success',
  } as FullMemberPlanFragment['successPage'],
  failPage = {
    url: 'https://example.com/fail',
  } as FullMemberPlanFragment['failPage'],
  confirmationPage = {
    url: 'https://example.com/confirmation',
  } as FullMemberPlanFragment['confirmationPage'],
  externalReward = 'https://example.com/mock-external-reward-url',
  goodies = [],
  periodicityPricing = [
    {
      __typename: 'PeriodicityPrice',
      periodicity: PaymentPeriodicity.Monthly,
      label: null,
      amountMin: 500,
      amountTarget: 700,
      amountMax: 1000,
    },
  ],
  defaultPaymentPeriodicity = null,
}: Partial<FullMemberPlanFragment> = {}): FullMemberPlanFragment & {
  active: boolean;
} => ({
  __typename: 'MemberPlan',
  id,
  image,
  name,
  slug,
  description,
  shortDescription,
  currency,
  tags,
  extendable,
  productType,
  availablePaymentMethods,
  successPageId,
  failPageId,
  confirmationPageId,
  successPage,
  failPage,
  confirmationPage,
  externalReward,
  goodies,
  periodicityPricing,
  defaultPaymentPeriodicity,
  active: true,
});

export const mockChallenge = ({
  type = CaptchaType.CfTurnstile,
  validUntil = null,
}: Partial<Challenge> = {}): Challenge => ({
  __typename: 'Challenge',
  challengeID: '1x00000000000000000000AA',
  challenge: null,
  validUntil,
  type,
});

export const mockSubscription = ({
  id = faker.string.nanoid(),
  autoRenew = true,
  extendable = true,
  isActive = true,
  canExtend = false,
  memberPlan = mockMemberPlan(),
  monthlyAmount = memberPlan.periodicityPricing?.find(
    price => price.periodicity === PaymentPeriodicity.Monthly
  )?.amountMin ?? 500,
  paymentMethod = memberPlan.availablePaymentMethods[0].paymentMethods[0],
  paymentMethodID = paymentMethod.id,
  paymentPeriodicity = memberPlan.availablePaymentMethods[0]
    .paymentPeriodicities[0],
  properties = [],
  url = faker.internet.url(),
  externalReward,
  goodie = null,
  deactivation,
  user = mockUser(),
  userID = user.id,
  startsAt = faker.date
    .past({
      years: 1,
    })
    .toISOString(),
  paidUntil = faker.date
    .future({
      years: 1,
    })
    .toISOString(),
}: Partial<PublicSubscription> = {}): PublicSubscription => ({
  __typename: 'PublicSubscription',
  id,
  autoRenew,
  extendable,
  isActive,
  canExtend,
  memberPlan,
  monthlyAmount,
  paymentMethod,
  paymentMethodID,
  paymentPeriodicity,
  properties,
  url,
  externalReward,
  goodie,
  deactivation,
  user,
  userID,
  startsAt,
  paidUntil,
});

export const mockInvoiceItem = ({
  name = faker.commerce.productName(),
  createdAt = faker.date
    .past({
      years: 1,
    })
    .toISOString(),
  amount = 500,
  description = faker.commerce.productDescription(),
}: Partial<FullInvoiceItemFragment> = {}): FullInvoiceItemFragment => ({
  __typename: 'InvoiceItem',
  name,
  amount,
  createdAt,
  modifiedAt: createdAt,
  quantity: 1,
  total: amount,
  description,
});

export const mockInvoice = ({
  id = faker.string.nanoid(),
  createdAt = faker.date
    .past({
      years: 1,
    })
    .toISOString(),
  canceledAt,
  dueAt = faker.date
    .past({
      years: 1,
    })
    .toISOString(),
  paidAt = dueAt,
  subscription = mockSubscription(),
  total = 500,
  items = [
    mockInvoiceItem({
      amount: subscription?.monthlyAmount,
      createdAt,
      total,
    }),
  ],
  mail = faker.internet.email(),
  description = faker.lorem.sentence(),
}: Partial<FullInvoiceFragment> = {}): FullInvoiceFragment => ({
  __typename: 'Invoice',
  id,
  createdAt,
  modifiedAt: createdAt,
  dueAt,
  paidAt,
  canceledAt,
  subscription,
  subscriptionID: subscription?.id,
  items,
  mail,
  total: items[0].total,
  description,
});

export const mockGiftCodeOffer = ({
  id = faker.string.nanoid(),
  name = 'Jahresabo verschenken',
  description = mockShortRichText(),
  periodicity = PaymentPeriodicity.Yearly,
  redemptionWindowMonths = 12,
  image = mockImage(),
  memberPlan = {
    __typename: 'MemberPlan',
    id: faker.string.nanoid(),
    name: 'Jahresabo',
  },
  price = {
    __typename: 'GiftCodePrice',
    amount: 12000,
    currency: Currency.Chf,
  },
  paymentMethods = [
    mockPaymentMethod({ name: 'Kreditkarte', paymentProviderID: 'stripe' }),
    mockPaymentMethod({ name: 'Twint', paymentProviderID: 'payrexx' }),
  ],
  issueBeforePayment = false,
}: Partial<FullGiftCodeOfferFragment> = {}): FullGiftCodeOfferFragment => ({
  __typename: 'GiftCodeOffer',
  id,
  name,
  description,
  periodicity,
  redemptionWindowMonths,
  image,
  memberPlan,
  price,
  paymentMethods,
  issueBeforePayment,
});

export const mockGiftCode = ({
  id = faker.string.nanoid(),
  status = GiftCodeStatus.Issued,
  paid = status !== GiftCodeStatus.Ordered,
  code = (
    status === GiftCodeStatus.Issued || status === GiftCodeStatus.Redeemed
  ) ?
    'ABCD-EFGH-JKMN'
  : null,
  recipientName = 'Anna Muster',
  message = 'Alles Gute zum Geburtstag!',
  periodicity = PaymentPeriodicity.Yearly,
  redemptionWindowMonths = 12,
  memberPlan = {
    __typename: 'MemberPlan',
    id: faker.string.nanoid(),
    name: 'Jahresabo',
  },
  offer = {
    __typename: 'GiftCodeOffer',
    id: faker.string.nanoid(),
    name: 'Jahresabo verschenken',
    paymentMethods: [
      mockPaymentMethod({ name: 'Kreditkarte', paymentProviderID: 'stripe' }),
    ],
  },
  amount = 12000,
  currency = Currency.Chf,
  invoiceId = faker.string.nanoid(),
  createdAt = new Date('2026-01-01T10:00:00.000Z').toISOString(),
  issuedAt = status === GiftCodeStatus.Ordered ?
    null
  : new Date('2026-01-02T10:00:00.000Z').toISOString(),
  expiresAt = issuedAt ?
    new Date('2027-01-02T10:00:00.000Z').toISOString()
  : null,
  redeemedAt = status === GiftCodeStatus.Redeemed ?
    new Date('2026-02-01T10:00:00.000Z').toISOString()
  : null,
  canceledAt = status === GiftCodeStatus.Canceled ?
    new Date('2026-01-20T10:00:00.000Z').toISOString()
  : null,
}: Partial<FullGiftCodeFragment> = {}): FullGiftCodeFragment => ({
  __typename: 'GiftCode',
  id,
  code,
  status,
  paid,
  recipientName,
  message,
  periodicity,
  redemptionWindowMonths,
  memberPlan,
  offer,
  amount,
  currency,
  invoiceId,
  createdAt,
  issuedAt,
  expiresAt,
  redeemedAt,
  canceledAt,
});
