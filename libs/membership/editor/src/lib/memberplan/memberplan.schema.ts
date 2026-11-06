import {
  type CreateMemberPlanMutationVariables,
  Currency,
  type FullMemberPlanFragment,
  PaymentPeriodicity,
  ProductType,
} from '@wepublish/editor/api';
import {
  crossField,
  formFields,
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
} from '@wepublish/form/editor';
import {
  ALL_PAYMENT_PERIODICITIES,
  getMonthlyEquivalentRange,
  PAYMENT_PERIODICITY_MONTHS,
} from '@wepublish/ui/editor';
import { z } from 'zod/v4';

const periodicityPriceSchema = z.object({
  periodicity: z.enum(PaymentPeriodicity),
  label: z.string().nullable(),
  amountMin: z.number().nullable(),
  amountTarget: z.number().nullable(),
  amountMax: z.number().nullable(),
});

export type PeriodicityPrice = z.output<typeof periodicityPriceSchema>;

const availablePaymentMethodSchema = z.object({
  paymentMethodIds: z
    .array(z.string())
    .meta({ label: 'memberPlanList.paymentMethods' }),
  paymentPeriodicities: z.array(z.enum(PaymentPeriodicity)).meta({
    label: 'memberPlanList.paymentPeriodicities',
    optionLabelPrefix: 'memberPlanList.paymentPeriodicity.',
  }),
  forceAutoRenewal: z.boolean().meta({
    label: 'memberPlanEdit.forceAutoRenewal',
    description: 'memberPlanEdit.forceAutoRenewalHelp',
  }),
});

type PaymentPeriodicitiesOf = {
  paymentPeriodicities?: readonly (PaymentPeriodicity | null | undefined)[];
};

export const enabledPeriodicitiesOf = (
  availablePaymentMethods: readonly PaymentPeriodicitiesOf[] | undefined
): PaymentPeriodicity[] => {
  const enabled = new Set(
    (availablePaymentMethods ?? []).flatMap(
      ({ paymentPeriodicities }) => paymentPeriodicities ?? []
    )
  );

  return ALL_PAYMENT_PERIODICITIES.filter(periodicity =>
    enabled.has(periodicity)
  );
};

export const materializePricing = (
  pricing: PeriodicityPrice[],
  enabledPeriodicities: PaymentPeriodicity[]
): PeriodicityPrice[] => {
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
  const materialized: PeriodicityPrice[] = toMaterialize.map(periodicity => {
    const existing = pricing.find(price => price.periodicity === periodicity);
    const months = PAYMENT_PERIODICITY_MONTHS[periodicity];

    return {
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
  });

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

export const prunePricing = (
  periodicityPricing: PeriodicityPrice[],
  availablePaymentMethods: readonly PaymentPeriodicitiesOf[]
): PeriodicityPrice[] => {
  const enabled = enabledPeriodicitiesOf(availablePaymentMethods);
  const pruned = periodicityPricing.filter(
    price =>
      enabled.includes(price.periodicity) &&
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

const pricedRows = (
  periodicityPricing: PeriodicityPrice[],
  availablePaymentMethods: readonly PaymentPeriodicitiesOf[]
) =>
  prunePricing(periodicityPricing, availablePaymentMethods).filter(
    price => price.amountMin != null
  );

const isPriceInRange = ({
  amountMin,
  amountTarget,
  amountMax,
}: PeriodicityPrice) => {
  const min = amountMin ?? 0;
  const targetFits =
    amountTarget == null ||
    (amountTarget >= min && (amountMax == null || amountTarget <= amountMax));

  return targetFits && (amountMax == null || amountMax >= min);
};

const memberPlanFields = z.object({
  name: z.string().min(1).meta({ label: 'memberPlanEdit.name' }),
  slug: z.string().min(1).meta({
    label: 'memberPlanEdit.slug',
    description: 'memberPlanEdit.slugHelp',
  }),
  productType: z.enum(ProductType).default(ProductType.Subscription).meta({
    label: 'memberplanForm.productType',
    helperText: 'memberplanForm.productTypeHelpText',
  }),
  active: z.boolean().default(true).meta({
    label: 'memberPlanEdit.active',
    helperText: 'memberPlanEdit.activeDescription',
  }),
  description: formFields.richText().nullish().meta({
    label: 'memberPlanEdit.description',
    description: 'memberPlanEdit.descriptionHelp',
  }),
  shortDescription: formFields.richText().nullish().meta({
    label: 'memberPlanEdit.shortDescription',
    description: 'memberPlanEdit.shortDescriptionHelp',
  }),
  externalReward: z
    .string()
    .nullish()
    .meta({ label: 'memberPlanEdit.externalReward' }),
  availablePaymentMethods: z
    .array(availablePaymentMethodSchema)
    .meta({ label: 'memberPlanEdit.paymentConfigs' }),
  currency: z
    .enum(Currency)
    .default(Currency.Chf)
    .meta({ label: 'memberPlanEdit.currency' }),
  defaultPaymentPeriodicity: z.enum(PaymentPeriodicity).nullish().meta({
    label: 'memberplanForm.defaultPaymentPeriodicity',
    helperText: 'memberplanForm.defaultPaymentPeriodicityHelpText',
    optionLabelPrefix: 'memberPlanList.paymentPeriodicity.',
  }),
  periodicityPricing: z
    .array(periodicityPriceSchema)
    .meta({ label: 'memberplanForm.periodicityPricing' }),
  extendable: z.boolean().default(true).meta({
    label: 'memberplanForm.extendableToggle',
    description: 'memberplanForm.extendableHelpText',
  }),
  maxCount: z.number().int().min(0).nullish().meta({
    label: 'memberplanForm.maxCount',
    description: 'memberplanForm.maxCountHelpText',
  }),
  migrateToTargetPaymentMethodID: z.string().nullish().meta({
    label: 'memberplanForm.migratePMTitle',
    description: 'memberplanForm.migratePMHelptext',
  }),
  successPageId: formFields
    .page()
    .nullish()
    .meta({ label: 'memberPlanEdit.successPage' }),
  failPageId: formFields
    .page()
    .nullish()
    .meta({ label: 'memberPlanEdit.failPage' }),
  confirmationPageId: formFields.page().nullish().meta({
    label: 'memberplanForm.confirmationPage',
    description: 'memberplanForm.confirmationPageHelptext',
  }),
  image: formFields.image().nullish().meta({ label: 'memberplanForm.image' }),
  tags: z.array(z.string()).meta({ label: 'memberPlanEdit.tags' }),
});

export const memberPlanSchema = crossField(
  crossField(
    memberPlanFields,
    ['periodicityPricing', 'availablePaymentMethods'],
    ({ periodicityPricing, availablePaymentMethods }) =>
      pricedRows(periodicityPricing, availablePaymentMethods).length > 0,
    {
      path: ['periodicityPricing'],
      error: 'memberplanForm.periodicityPricingRequired',
    }
  ),
  ['periodicityPricing', 'availablePaymentMethods'],
  ({ periodicityPricing, availablePaymentMethods }) =>
    pricedRows(periodicityPricing, availablePaymentMethods).every(
      isPriceInRange
    ),
  {
    path: ['periodicityPricing'],
    error: 'memberPlanEdit.targetPriceMustBeGreaterThanMin',
  }
);

export type MemberPlanFormValues = FormValues<typeof memberPlanSchema>;

export type MemberPlanFormOutput = FormOutput<typeof memberPlanSchema>;

export const createMemberPlanDefaults: FormDefaultValues<
  typeof memberPlanSchema
> = {
  periodicityPricing: [
    {
      periodicity: PaymentPeriodicity.Monthly,
      label: null,
      amountMin: 0,
      amountTarget: null,
      amountMax: null,
    },
  ],
};

export const editTitleParams = ({ name }: MemberPlanFormValues) => ({
  name: name || '…',
});

export const fromMemberPlan = (
  memberPlan: FullMemberPlanFragment
): FormDefaultValues<typeof memberPlanSchema> => ({
  name: memberPlan.name,
  slug: memberPlan.slug,
  productType: memberPlan.productType,
  active: memberPlan.active,
  description: memberPlan.description,
  shortDescription: memberPlan.shortDescription,
  externalReward: memberPlan.externalReward,
  availablePaymentMethods: (memberPlan.availablePaymentMethods ?? []).map(
    ({ paymentMethods, paymentPeriodicities, forceAutoRenewal }) => ({
      paymentMethodIds: paymentMethods.map(({ id }) => id),
      paymentPeriodicities,
      forceAutoRenewal,
    })
  ),
  currency: memberPlan.currency,
  defaultPaymentPeriodicity: memberPlan.defaultPaymentPeriodicity,
  periodicityPricing: (memberPlan.periodicityPricing ?? []).map(
    ({ periodicity, label, amountMin, amountTarget, amountMax }) => ({
      periodicity,
      label: label ?? null,
      amountMin: amountMin ?? null,
      amountTarget: amountTarget ?? null,
      amountMax: amountMax ?? null,
    })
  ),
  extendable: memberPlan.extendable,
  maxCount: memberPlan.maxCount,
  migrateToTargetPaymentMethodID: memberPlan.migrateToTargetPaymentMethodID,
  successPageId: memberPlan.successPageId,
  failPageId: memberPlan.failPageId,
  confirmationPageId: memberPlan.confirmationPageId,
  image: memberPlan.image,
  tags: memberPlan.tags ?? [],
});

export const toMemberPlanVariables = ({
  name,
  slug,
  productType,
  active,
  description,
  shortDescription,
  externalReward,
  availablePaymentMethods,
  currency,
  defaultPaymentPeriodicity,
  periodicityPricing,
  extendable,
  maxCount,
  migrateToTargetPaymentMethodID,
  successPageId,
  failPageId,
  confirmationPageId,
  image,
  tags,
}: MemberPlanFormOutput): CreateMemberPlanMutationVariables => ({
  name,
  slug,
  tags,
  imageID: image?.id ?? null,
  description: description ?? null,
  shortDescription: shortDescription ?? null,
  active,
  availablePaymentMethods: availablePaymentMethods.map(
    ({ paymentMethodIds, paymentPeriodicities, forceAutoRenewal }) => ({
      paymentPeriodicities,
      forceAutoRenewal,
      paymentMethodIDs: paymentMethodIds,
    })
  ),
  currency,
  periodicityPricing: prunePricing(periodicityPricing, availablePaymentMethods),
  defaultPaymentPeriodicity:
    (
      defaultPaymentPeriodicity &&
      enabledPeriodicitiesOf(availablePaymentMethods).includes(
        defaultPaymentPeriodicity
      )
    ) ?
      defaultPaymentPeriodicity
    : null,
  extendable,
  externalReward: externalReward || null,
  maxCount: maxCount || null,
  productType,
  migrateToTargetPaymentMethodID: migrateToTargetPaymentMethodID || null,
  successPageId: successPageId || null,
  failPageId: failPageId || null,
  confirmationPageId: confirmationPageId || null,
});
