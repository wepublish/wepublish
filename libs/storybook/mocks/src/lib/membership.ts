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
  name = 'Visa',
  slug = name,
  description = 'Kredit- / Debitkarte',
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
  createdAt: new Date('2023-01-01').toISOString(),
  modifiedAt: new Date('2023-01-01').toISOString(),
});

export const mockAvailablePaymentMethod = ({
  forceAutoRenewal = false,
  paymentPeriodicities = [
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Lifetime,
  ],
  paymentMethods = [
    mockPaymentMethod({ name: 'Visa', description: 'Kreditkarte' }),
    mockPaymentMethod({ name: 'Twint', description: 'Mobiles Bezahlen' }),
  ],
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
  name = 'Basis Abo',
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
  type = CaptchaType.Algebraic,
  validUntil = '2023-06-13',
}: Partial<Challenge> = {}): Challenge => ({
  __typename: 'Challenge',
  challengeID:
    'MTY4NjY2MzEyMDU0MjtGOHpxUEhscldLL0I5a0t4aVdtaTQrMDRob21iRG5sMm5yWEJob0YybUFjPTs0NzI1',
  challenge:
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0,0,200,200"><rect width="100%" height="100%" fill="#ffffff"/><path d="M12 170 C89 84,113 69,184 148" stroke="#56e57a" fill="none"/><path d="M8 92 C120 32,84 73,183 109" stroke="#68cced" fill="none"/><path fill="#da9e62" d="M120.01 97.20L120.07 93.78L143.99 93.68L144.08 97.24L119.94 97.12ZM120.02 109.14L120.06 105.70L144.10 105.72L144.06 109.15L119.92 109.03Z"/><path d="M2 185 C113 113,88 106,196 22" stroke="#914ad8" fill="none"/></svg>',
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
  url = 'https://example.com',
  externalReward,
  deactivation,
  user = mockUser(),
  userID = user.id,
  startsAt = new Date('2019-01-01').toISOString(),
  paidUntil = new Date('2021-01-01').toISOString(),
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
  name = 'Basis Abo',
  createdAt = new Date('2019-06-01').toISOString(),
  amount = 500,
  description = 'Monatsbeitrag',
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
  createdAt = new Date('2019-06-01').toISOString(),
  canceledAt,
  dueAt = new Date('2019-07-01').toISOString(),
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
  mail = 'mock@example.com',
  description = 'Jahresabonnement',
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
