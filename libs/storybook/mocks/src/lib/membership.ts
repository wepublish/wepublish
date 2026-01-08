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
  type = CaptchaType.Algebraic,
  validUntil = '2023-06-13',
}: Partial<Challenge> = {}): Challenge => ({
  __typename: 'Challenge',
  challengeID:
    'MTY4NjY2MzEyMDU0MjtGOHpxUEhscldLL0I5a0t4aVdtaTQrMDRob21iRG5sMm5yWEJob0YybUFjPTs0NzI1',
  challenge:
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0,0,200,200"><rect width="100%" height="100%" fill="#ffffff"/><path d="M12 170 C89 84,113 69,184 148" stroke="#56e57a" fill="none"/><path d="M8 92 C120 32,84 73,183 109" stroke="#68cced" fill="none"/><path fill="#da9e62" d="M120.01 97.20L120.07 93.78L143.99 93.68L144.08 97.24L119.94 97.12ZM120.02 109.14L120.06 105.70L144.10 105.72L144.06 109.15L119.92 109.03Z"/><path d="M2 185 C113 113,88 106,196 22" stroke="#914ad8" fill="none"/><path fill="#9b7ef0" d="M91.51 110.32L91.51 110.32L91.53 110.34Q91.62 111.94 92.20 113.17L92.07 113.03L92.16 113.13Q92.62 114.23 93.66 115.15L93.64 115.14L93.72 115.21Q94.86 116.25 96.26 116.75L96.07 116.56L96.24 116.73Q97.54 117.13 99.17 117.13L99.19 117.16L99.12 117.08Q102.42 117.25 104.35 115.52L104.25 115.41L104.24 115.41Q106.29 113.79 106.29 110.99L106.10 110.80L106.15 110.84Q106.10 109.06 105.32 107.83L105.35 107.86L105.37 107.88Q104.69 106.76 103.35 105.83L103.37 105.85L103.35 105.83Q101.98 104.88 100.22 104.13L100.11 104.02L100.22 104.13Q98.35 103.27 96.44 102.48L96.57 102.61L96.50 102.54Q94.34 103.97 92.92 105.90L92.88 105.86L93.05 106.03Q91.43 107.77 91.43 110.24ZM101.55 100.37L101.59 100.41L101.67 100.48Q103.33 98.73 104.31 96.93L104.46 97.08L104.42 97.05Q105.28 95.14 105.28 93.18L105.41 93.31L105.40 93.30Q105.44 90.65 103.81 88.83L103.81 88.82L103.64 88.65Q102.02 86.84 99.05 86.84L99.04 86.83L99.05 86.83Q96.59 86.89 94.97 88.46L95.07 88.56L95.04 88.53Q93.45 90.14 93.45 92.77L93.34 92.66L93.42 92.74Q93.40 94.35 94.07 95.49L94.05 95.47L94.02 95.44Q94.70 96.60 95.85 97.49L95.94 97.58L95.85 97.50Q97.06 98.45 98.54 99.15L98.41 99.02L98.59 99.20Q99.97 99.80 101.60 100.41ZM87.31 110.71L87.32 110.72L87.33 110.73Q87.29 108.95 87.88 107.47L88.04 107.64L87.94 107.53Q88.58 106.10 89.50 104.89L89.42 104.81L89.45 104.85Q90.49 103.76 91.70 102.83L91.66 102.80L91.51 102.65Q92.73 101.74 94.02 101.07L94.16 101.21L94.03 100.85L94.06 100.89Q92.22 99.60 90.71 97.61L90.57 97.48L90.57 97.47Q89.20 95.63 89.20 92.77L89.20 92.77L89.07 92.65Q89.07 90.58 89.86 88.90L89.83 88.87L89.81 88.85Q90.70 87.28 92.05 86.08L91.96 85.99L92.00 86.03Q93.43 84.91 95.28 84.24L95.21 84.17L95.15 84.11Q97.00 83.44 99.18 83.44L99.28 83.54L99.31 83.57Q101.70 83.60 103.55 84.30L103.40 84.16L103.39 84.15Q105.26 84.87 106.58 86.13L106.57 86.12L106.68 86.23Q107.89 87.39 108.59 89.15L108.57 89.13L108.56 89.12Q109.37 90.99 109.37 93.06L109.37 93.07L109.30 93.00Q109.30 94.40 108.83 95.69L108.89 95.75L108.86 95.72Q108.40 97.02 107.70 98.14L107.65 98.10L107.60 98.04Q107.06 99.32 106.19 100.22L106.08 100.11L106.20 100.23Q105.33 101.12 104.49 101.74L104.42 101.67L104.33 101.80L104.35 101.82Q105.53 102.50 106.65 103.37L106.75 103.46L106.67 103.39Q107.74 104.21 108.61 105.30L108.77 105.46L108.76 105.45Q109.55 106.46 110.08 107.86L110.10 107.88L109.99 107.77Q110.68 109.33 110.68 111.12L110.63 111.07L110.56 111.00Q110.58 113.04 109.74 114.77L109.83 114.87L109.74 114.77Q108.94 116.55 107.43 117.84L107.35 117.75L107.52 117.93Q105.84 119.05 103.71 119.78L103.75 119.81L103.70 119.77Q101.60 120.52 99.02 120.52L99.16 120.66L99.12 120.61Q96.53 120.55 94.38 119.82L94.45 119.89L94.31 119.76Q92.19 119.06 90.65 117.74L90.75 117.85L90.70 117.79Q89.24 116.56 88.34 114.77L88.23 114.66L88.22 114.65Q87.44 112.96 87.44 110.84Z"/><path fill="#89ef89" d="M32.28 102.58L32.17 102.48L32.16 102.46Q33.96 102.53 35.95 101.44L35.87 101.36L35.98 101.47Q37.92 100.33 39.71 97.75L39.76 97.80L39.81 97.85Q39.26 92.48 37.24 89.80L37.32 89.87L37.37 89.93Q35.33 87.21 31.92 87.21L31.87 87.17L31.80 87.10Q30.66 87.25 29.51 87.81L29.46 87.75L29.46 87.75Q28.30 88.30 27.46 89.33L27.39 89.26L27.44 89.32Q26.59 90.34 26.12 91.80L26.16 91.84L26.21 91.89Q25.64 93.26 25.64 95.00L25.73 95.09L25.56 94.91Q25.61 98.49 27.23 100.50L27.21 100.48L27.22 100.49Q28.87 102.53 32.23 102.53ZM21.96 116.85L24.44 113.84L24.59 113.99Q25.66 115.22 27.20 116.01L27.17 115.99L27.12 115.93Q28.62 116.67 30.30 116.67L30.33 116.71L30.49 116.87Q32.28 116.75 33.96 115.97L34.07 116.08L33.97 115.98Q35.61 115.15 36.90 113.33L36.85 113.28L36.95 113.39Q38.21 111.54 39.00 108.63L39.00 108.63L38.95 108.58Q39.87 105.80 39.92 101.49L39.84 101.40L39.81 101.38Q38.27 103.64 36.03 104.88L35.98 104.83L36.01 104.86Q33.72 106.04 31.48 106.04L31.55 106.11L31.52 106.08Q26.83 106.03 24.08 103.29L24.08 103.29L24.02 103.23Q21.34 100.55 21.34 95.00L21.42 95.08L21.35 95.02Q21.23 92.32 22.07 90.22L22.09 90.24L22.25 90.40Q23.08 88.29 24.51 86.78L24.36 86.63L24.50 86.77Q25.95 85.28 27.88 84.44L27.84 84.40L27.81 84.37Q29.80 83.59 31.93 83.59L31.78 83.44L31.86 83.52Q34.54 83.56 36.81 84.63L36.80 84.62L36.72 84.54Q39.00 85.61 40.65 87.77L40.63 87.75L40.72 87.84Q42.31 89.94 43.24 93.16L43.33 93.25L43.15 93.07Q44.24 96.45 44.24 100.76L44.19 100.72L44.26 100.79Q44.25 106.15 43.13 109.93L42.97 109.77L43.06 109.86Q41.95 113.65 40.05 116.03L39.95 115.94L39.97 115.95Q38.09 118.37 35.66 119.46L35.65 119.45L35.63 119.43Q33.16 120.49 30.47 120.49L30.64 120.66L30.57 120.59Q27.69 120.56 25.53 119.50L25.46 119.42L25.47 119.43Q23.31 118.37 21.85 116.74L21.95 116.83Z"/><path d="M7 150 C85 3,113 64,196 87" stroke="#b7e589" fill="none"/><path d="M17 171 C110 40,106 99,185 197" stroke="#5175e0" fill="none"/><path fill="#6dedcd" d="M166.04 108.77L162.14 108.90L162.04 108.80Q161.72 106.63 162.20 104.87L162.13 104.80L162.17 104.84Q162.65 103.08 163.49 101.60L163.54 101.65L163.55 101.66Q164.41 100.20 165.50 98.91L165.46 98.86L165.42 98.82Q166.53 97.56 167.48 96.30L167.41 96.22L167.59 96.40Q168.54 95.14 169.18 93.85L169.01 93.68L169.14 93.81Q169.76 92.50 169.76 90.99L169.64 90.87L169.72 90.94Q169.78 88.77 168.41 87.17L168.42 87.18L168.44 87.20Q166.94 85.48 164.25 85.48L164.31 85.54L164.28 85.50Q162.49 85.56 160.84 86.43L160.78 86.37L160.71 86.31Q159.08 87.19 157.79 88.70L157.88 88.79L155.15 86.29L155.18 86.31Q156.95 84.28 159.25 82.97L159.35 83.07L159.22 82.93Q161.58 81.68 164.60 81.68L164.70 81.78L164.67 81.75Q168.97 81.68 171.57 84.06L171.54 84.03L171.59 84.08Q174.18 86.44 174.18 90.64L174.26 90.73L174.25 90.71Q174.21 92.52 173.54 94.03L173.47 93.97L173.45 93.95Q172.92 95.60 171.94 96.94L171.91 96.91L171.87 96.87Q170.91 98.24 169.82 99.56L169.78 99.51L169.84 99.58Q168.72 100.86 167.79 102.26L167.74 102.20L167.80 102.27Q166.78 103.57 166.28 105.17L166.44 105.33L166.27 105.16Q165.82 106.81 166.04 108.77L166.15 108.87ZM160.87 117.09L160.83 117.06L160.79 117.02Q160.85 115.45 161.80 114.47L161.84 114.50L161.82 114.49Q162.83 113.57 164.23 113.57L164.26 113.60L164.15 113.48Q165.65 113.58 166.63 114.56L166.49 114.43L166.56 114.50Q167.62 115.55 167.62 117.18L167.61 117.17L167.59 117.15Q167.50 118.57 166.52 119.55L166.53 119.56L166.49 119.52Q165.60 120.59 164.20 120.59L164.29 120.68L164.12 120.51Q162.87 120.67 161.92 119.69L161.78 119.54L161.92 119.68Q160.80 118.54 160.80 117.02Z"/><path fill="#7ce396" d="M59.54 107.59L59.54 104.07L72.37 104.02L72.48 107.65L59.54 107.59Z"/></svg>',
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
