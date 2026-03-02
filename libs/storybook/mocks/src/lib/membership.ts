import {
  AvailablePaymentMethod,
  CaptchaType,
  Challenge,
  Currency,
  Invoice,
  InvoiceItem,
  MemberPlan,
  PaymentMethod,
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
}: Partial<PaymentMethod> = {}): PaymentMethod & {
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
  AvailablePaymentMethod & {
    paymentMethodIDs: string[];
  }
> = {}): AvailablePaymentMethod & {
  paymentMethodIDs: string[];
} => ({
  __typename: 'AvailablePaymentMethod',
  forceAutoRenewal,
  paymentMethods,
  paymentPeriodicities,
  paymentMethodIDs,
});

export const mockMemberPlan = ({
  id = faker.string.nanoid(),
  image = mockImage(),
  amountPerMonthMin = 500,
  amountPerMonthTarget = 700,
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
  amountPerMonthMax = 1000,
  externalReward = 'https://example.com/mock-external-reward-url',
}: Partial<MemberPlan> = {}): MemberPlan & { active: boolean } => ({
  __typename: 'MemberPlan',
  id,
  image,
  amountPerMonthMin,
  amountPerMonthTarget,
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
  amountPerMonthMax,
  externalReward,
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
  monthlyAmount = memberPlan.amountPerMonthMin,
  paymentMethod = memberPlan.availablePaymentMethods[0].paymentMethods[0],
  paymentMethodID = paymentMethod.id,
  paymentPeriodicity = memberPlan.availablePaymentMethods[0]
    .paymentPeriodicities[0],
  properties = [],
  url = faker.internet.url(),
  externalReward,
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
}: Partial<InvoiceItem> = {}): InvoiceItem => ({
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
}: Partial<Invoice> = {}): Invoice => ({
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
