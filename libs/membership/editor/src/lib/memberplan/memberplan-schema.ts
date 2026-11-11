import {
  Currency,
  FullAvailablePaymentMethodFragment,
  FullMemberPlanFragment,
  PaymentPeriodicity,
  ProductType,
} from '@wepublish/editor/api';
import {
  getMonthlyEquivalentRange,
  ListValue,
  PAYMENT_PERIODICITY_MONTHS,
} from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { z } from 'zod';

export type PeriodicityPriceValue = NonNullable<
  FullMemberPlanFragment['periodicityPricing']
>[number];

export const materializePricing = (
  pricing: PeriodicityPriceValue[],
  enabledPeriodicities: PaymentPeriodicity[]
): PeriodicityPriceValue[] => {
  const monthlyEnabled = enabledPeriodicities.includes(
    PaymentPeriodicity.Monthly
  );

  const toMaterialize = (
    monthlyEnabled ?
      [PaymentPeriodicity.Monthly]
    : enabledPeriodicities).filter(
    periodicity =>
      !pricing.some(
        price => price.periodicity === periodicity && price.amountMin != null
      )
  );

  if (!toMaterialize.length) {
    return pricing;
  }

  const equivalent = getMonthlyEquivalentRange(pricing);
  const materialized: PeriodicityPriceValue[] = toMaterialize.map(
    periodicity => {
      const existing = pricing.find(price => price.periodicity === periodicity);
      const months = PAYMENT_PERIODICITY_MONTHS[periodicity];

      return {
        __typename: 'PeriodicityPrice',
        ...existing,
        periodicity,
        label: existing?.label ?? null,
        amountMin: Math.round(equivalent.amountPerMonthMin * months),
        amountTarget:
          equivalent.amountPerMonthTarget != null ?
            Math.round(equivalent.amountPerMonthTarget * months)
          : null,
        amountMax:
          equivalent.amountPerMonthMax != null ?
            Math.round(equivalent.amountPerMonthMax * months)
          : null,
      };
    }
  );

  return [
    ...pricing.filter(
      entry =>
        !materialized.some(
          replaced => replaced.periodicity === entry.periodicity
        )
    ),
    ...materialized,
  ];
};

export const enabledPeriodicitiesOf = (
  availablePaymentMethods: ListValue<FullAvailablePaymentMethodFragment>[],
  order: PaymentPeriodicity[]
): PaymentPeriodicity[] => {
  const enabled = new Set(
    availablePaymentMethods.flatMap(({ value }) => value.paymentPeriodicities)
  );

  return order.filter(periodicity => enabled.has(periodicity));
};

export const createMemberPlanSchema = (t: TFunction) =>
  z
    .object({
      name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
      slug: z.string().min(1, t('errorMessages.required')),
      currency: z.nativeEnum(Currency),
      tags: z.array(z.string()),
      image: z.any().nullish(),
      description: z.any().nullish(),
      shortDescription: z.any().nullish(),
      active: z.boolean(),
      extendable: z.boolean(),
      externalReward: z.string().nullish(),
      maxCount: z.number().nullish(),
      productType: z.nativeEnum(ProductType),
      migrateToTargetPaymentMethodID: z.string().nullish(),
      successPageId: z.string().nullish(),
      failPageId: z.string().nullish(),
      confirmationPageId: z.string().nullish(),
      defaultPaymentPeriodicity: z.nativeEnum(PaymentPeriodicity).nullish(),
      periodicityPricing: z.array(z.custom<PeriodicityPriceValue>()),
      availablePaymentMethods: z.array(
        z.custom<ListValue<FullAvailablePaymentMethodFragment>>()
      ),
    })
    .superRefine((plan, ctx) => {
      const priced = prunePricing(plan).filter(
        price => price.amountMin != null
      );

      if (!priced.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['periodicityPricing'],
          message: t('memberplanForm.periodicityPricingRequired'),
        });

        return;
      }

      const invalid = priced.some(
        price =>
          (price.amountTarget != null &&
            (price.amountTarget < price.amountMin! ||
              (price.amountMax != null &&
                price.amountTarget > price.amountMax))) ||
          (price.amountMax != null && price.amountMax < price.amountMin!)
      );

      if (invalid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['periodicityPricing'],
          message: t('memberPlanEdit.targetPriceMustBeGreaterThanMin'),
        });
      }
    });

export type MemberPlanFormValues = z.infer<
  ReturnType<typeof createMemberPlanSchema>
>;

export const prunePricing = ({
  periodicityPricing,
  availablePaymentMethods,
}: {
  periodicityPricing: PeriodicityPriceValue[];
  availablePaymentMethods: ListValue<FullAvailablePaymentMethodFragment>[];
}): PeriodicityPriceValue[] => {
  const pruned = periodicityPricing.filter(
    price =>
      availablePaymentMethods.some(({ value }) =>
        value.paymentPeriodicities.includes(price.periodicity)
      ) &&
      (price.label != null || price.amountMin != null)
  );

  const pricedMonthlyRow = periodicityPricing.find(
    price =>
      price.periodicity === PaymentPeriodicity.Monthly &&
      price.amountMin != null
  );

  return !pruned.some(price => price.amountMin != null) && pricedMonthlyRow ?
      [
        ...pruned.filter(
          price => price.periodicity !== PaymentPeriodicity.Monthly
        ),
        pricedMonthlyRow,
      ]
    : pruned;
};

export const EMPTY_MEMBER_PLAN: MemberPlanFormValues = {
  name: '',
  slug: '',
  currency: Currency.Chf,
  tags: [],
  image: null,
  description: null,
  shortDescription: null,
  active: true,
  extendable: true,
  externalReward: null,
  maxCount: null,
  productType: ProductType.Subscription,
  migrateToTargetPaymentMethodID: null,
  successPageId: null,
  failPageId: null,
  confirmationPageId: null,
  defaultPaymentPeriodicity: null,
  periodicityPricing: [
    {
      __typename: 'PeriodicityPrice',
      periodicity: PaymentPeriodicity.Monthly,
      label: null,
      amountMin: 0,
      amountTarget: null,
      amountMax: null,
    },
  ],
  availablePaymentMethods: [],
};

export const toFormValues = (
  memberPlan: FullMemberPlanFragment,
  generateId: () => string
): MemberPlanFormValues => ({
  name: memberPlan.name,
  slug: memberPlan.slug,
  currency: memberPlan.currency,
  tags: memberPlan.tags ?? [],
  image: memberPlan.image,
  description: memberPlan.description,
  shortDescription: memberPlan.shortDescription,
  active: memberPlan.active,
  extendable: memberPlan.extendable,
  externalReward: memberPlan.externalReward,
  maxCount: memberPlan.maxCount,
  productType: memberPlan.productType,
  migrateToTargetPaymentMethodID: memberPlan.migrateToTargetPaymentMethodID,
  successPageId: memberPlan.successPageId,
  failPageId: memberPlan.failPageId,
  confirmationPageId: memberPlan.confirmationPageId,
  defaultPaymentPeriodicity: memberPlan.defaultPaymentPeriodicity,
  periodicityPricing: memberPlan.periodicityPricing ?? [],
  availablePaymentMethods: (memberPlan.availablePaymentMethods ?? []).map(
    availablePaymentMethod => ({
      id: generateId(),
      value: availablePaymentMethod,
    })
  ),
});
